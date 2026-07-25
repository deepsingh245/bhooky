# Phase 1 Plan — Core AI Search MVP (Web, Read-Only)

> Scope per `BHOOKY_BUILD_PLAN.md` §11: chat/search UI, Gemini intent parsing, live Swiggy search (staging), Bhooky ranking, query logging. **No cart, no order placement, no coupons** — those are Phase 2. Assumes Phase 0 is done: repo/monorepo exists, GCP+Firebase project in `asia-south1`, OAuth PKCE flow already proven against Swiggy staging (a stored session that can call `get_addresses` successfully).
>
> This document plans every file Phase 1 will add, before any of it is written: what it's for, what it exports, and the logic it holds. Nothing here is implementation yet.

---

## 0. Definition of done

- Typing a natural-language query on the web app returns a ranked grid of real Swiggy (staging) restaurant/dish cards within a few seconds.
- Every query + its parsed intent is logged to Firestore.
- If the user's Swiggy session is missing/expired, the UI shows a reconnect prompt instead of a broken search.
- This flow is solid enough to record as the demo video for the Builders Club production-access application (`BHOOKY_BUILD_PLAN.md` §6).

---

## 1. Folder structure this phase adds to

```
apps/
  functions/
    src/
      gemini/
        geminiClient.ts
        parseIntent.ts
      swiggy/
        mcpClient.ts
        session.ts
        searchRestaurants.ts
        getMenu.ts
      search/
        normalize.ts
        searchFood.ts
      ranking/
        rankResults.ts
      logging/
        logQuery.ts
      http/
        searchHandler.ts
      index.ts
  web/
    src/
      pages/
        SearchPage.tsx
      components/
        SearchBar.tsx
        FilterChips.tsx
        FoodCard.tsx
        ResultsGrid.tsx
        SwiggyReconnectBanner.tsx
      hooks/
        useSearch.ts
        useSwiggySession.ts
      lib/
        apiClient.ts
      App.tsx
      main.tsx
packages/
  shared/
    src/
      types/
        intent.ts
        restaurant.ts
        ranking.ts
      constants/
        rankingWeights.ts
```

---

## 2. `packages/shared` — types both sides import

Shared package exists so the backend's response shape and the frontend's expected shape can never drift apart (both import the same types).

### `types/intent.ts`
- `ParsedIntent` interface: `food_type` (`"veg" | "non_veg" | "any"`), `taste` (`string | null`), `budget` (`number | null`), `time` (`"late_night" | "lunch" | "dinner" | "any"`), plus `raw_query: string`.
- This is the exact shape Gemini must return — used both to build the Gemini structured-output schema and to type the parser's return value.

### `types/restaurant.ts`
- `NormalizedRestaurant`: `id`, `name`, `rating`, `priceRange`, `distanceKm`, `isOpen`, `cuisines`.
- `NormalizedMenuItem`: `id`, `restaurantId`, `name`, `price`, `veg`, `tags`, `available`.
- These are Bhooky's internal shape — the normalize step's job is translating whatever `search_restaurants`/`get_restaurant_menu` return into exactly this.

### `types/ranking.ts`
- `RankedCard`: a `NormalizedMenuItem` + its parent restaurant fields flattened, plus `score: number` and a `scoreBreakdown` object (budget/distance/rating/offer/intent sub-scores) — kept in the response so the UI can eventually show "why this result," and so `ranking_feedback` logging has something concrete to attach to.

### `constants/rankingWeights.ts`
- The five weights from the formula (`0.3/0.2/0.2/0.2/0.1`) as named constants, not magic numbers, so Phase 3's feedback-driven tuning has one place to change.

---

## 3. `apps/functions` — backend

### `gemini/geminiClient.ts`
- Single exported function `getGeminiClient()` that lazily constructs and caches the Gemini SDK client using an API key read from environment/Secret Manager.
- No business logic — just avoids re-instantiating the client on every invocation.

### `gemini/parseIntent.ts`
- Exported `parseIntent(rawQuery: string): Promise<ParsedIntent>`.
- Calls Gemini in **structured output / function-calling mode**, passing a JSON schema built from `ParsedIntent`, so the model is constrained to return valid fields rather than free text.
- Validates the response against the schema before returning; on a malformed response, retries once with a stricter instruction, then falls back to a permissive default (`food_type: "any"`, everything else `null`) rather than failing the whole search.
- Pure function w.r.t. the rest of the system — it never touches Firestore or Swiggy.

### `swiggy/mcpClient.ts`
- Exported `getSwiggyMcpClient(bearerToken: string)`: constructs an MCP client (`@modelcontextprotocol/sdk`) pointed at the Swiggy Food staging server, with the given bearer token attached to every call.
- Not cached across users (token is per-user) — cached only per-request.

### `swiggy/session.ts`
- Exported `getValidSwiggySession(userId: string): Promise<{ token: string }>`.
- Reads `swiggy_sessions/{userId}` from Firestore, checks expiry locally as a fast-path, and throws a typed `SwiggySessionExpiredError` if missing/expired — this is the error `searchHandler.ts` maps to the "reconnect" response the frontend watches for.
- Phase 1 does not implement re-authentication itself (that flow exists from Phase 0) — this module only detects the need for it.

### `swiggy/searchRestaurants.ts`
- Exported `searchRestaurants(client, addressId, intent: ParsedIntent)`.
- Builds the `search_restaurants` tool-call arguments from the parsed intent (query string assembled from taste/food_type/time, plus `availabilityStatus: "OPEN"` filter) and returns the raw tool response.

### `swiggy/getMenu.ts`
- Exported `getMenuForCandidates(client, restaurantIds: string[])`.
- Calls `get_restaurant_menu` (or `search_menu` where a dish-level query is more appropriate than a whole-menu fetch) for each of the top-N candidate restaurants from the search step, in parallel, with a small concurrency cap to stay under the per-minute rate limit.

### `search/normalize.ts`
- Exported `normalizeRestaurant(raw)` and `normalizeMenuItem(raw)`.
- The only place that knows the shape of Swiggy's raw MCP response — isolates that coupling so a Swiggy response-shape change only requires editing this one file.

### `ranking/rankResults.ts`
- Exported `rankResults(items: NormalizedMenuItem[], restaurants: NormalizedRestaurant[], intent: ParsedIntent): RankedCard[]`.
- Implements the scoring formula from `BHOOKY_BUILD_PLAN.md` §5: per-item budget-match, distance, rating, offer, and intent-match sub-scores, combined via `rankingWeights.ts`, sorted descending, truncated to top-N (e.g. 20).
- Phase 1 has no offer data yet (that's `fetch_food_coupons` in Phase 2) — offer sub-score defaults to a neutral constant, called out with a code comment so Phase 2 knows exactly what to wire in.

### `search/searchFood.ts`
- Exported `searchFood(userId, addressId, rawQuery): Promise<RankedCard[]>` — the orchestrator.
- Sequence: `getValidSwiggySession` → `parseIntent` → `searchRestaurants` → `getMenuForCandidates` → `normalize*` → `rankResults` → fire-and-forget call to `logQuery` → return.
- This is the one function `searchHandler.ts` calls; every other backend file exists to be called *by* this one.

### `logging/logQuery.ts`
- Exported `logQuery(userId, rawQuery, intent, topResultIds)`.
- Single Firestore write to the `queries` collection. Deliberately fire-and-forget (doesn't block the response) — a logging failure must never fail a search.

### `http/searchHandler.ts`
- The actual exported Cloud Function (HTTPS callable).
- Validates the incoming request shape (query string, addressId, auth context) with `zod`, calls `searchFood`, and maps errors to response codes the frontend understands — in particular `SwiggySessionExpiredError` → a distinct `{ code: "SWIGGY_RECONNECT_REQUIRED" }` payload rather than a generic 500.

### `index.ts`
- Exports `searchHandler` as the deployed Cloud Function entry point. Nothing else in Phase 1.

---

## 4. `apps/web` — frontend

### `lib/apiClient.ts`
- Thin wrapper exporting `callSearchFood(query, addressId)` that invokes the Firebase callable function and returns a typed `RankedCard[]` or throws a typed error (including the reconnect-required case).

### `hooks/useSwiggySession.ts`
- Exposes `{ connected, loading }` by checking session state (reuses whatever Phase 0 exposed for OAuth status).
- Phase 1 only *reads* this state to decide whether to show `SwiggyReconnectBanner` — it does not implement the reconnect flow itself.

### `hooks/useSearch.ts`
- Exposes `{ results, status, error, search(query) }`.
- Calls `apiClient.callSearchFood`, manages `idle | loading | success | error` status, and specifically recognizes the reconnect-required error so the page can render the banner instead of a generic error state.

### `components/SearchBar.tsx`
- Controlled text input + submit button/Enter-to-submit; disables itself while `status === "loading"`.

### `components/FilterChips.tsx`
- Renders the current `ParsedIntent` (once a search has run) as editable chips (food type, taste, budget, time).
- Editing a chip re-triggers `search()` with an updated query built from the edited intent — lets a user correct a misparse without retyping the whole sentence.

### `components/FoodCard.tsx`
- Renders one `RankedCard`: dish/restaurant name, price, rating, distance/time, veg indicator.
- Includes the **"Order on Swiggy" fallback button** — a plain deep link (no MCP call) — kept in Phase 1 as a safety net since real in-app ordering isn't built until Phase 2.

### `components/ResultsGrid.tsx`
- Grid of `FoodCard`s; renders loading skeletons while `status === "loading"` and an empty-state illustration/message when a search returns zero results.

### `components/SwiggyReconnectBanner.tsx`
- Shown whenever `useSwiggySession` reports disconnected/expired, or `useSearch` surfaces a reconnect-required error; links into the existing Phase 0 OAuth entry point.

### `pages/SearchPage.tsx`
- Composes `SearchBar` + `FilterChips` + `ResultsGrid` + `SwiggyReconnectBanner`, wiring them to the two hooks above. The only page in Phase 1.

### `App.tsx` / `main.tsx`
- Minimal shell rendering `SearchPage` — no routing needed yet since there's only one screen.

---

## 5. Config/env this phase needs

- `GEMINI_API_KEY` (Secret Manager)
- `SWIGGY_MCP_STAGING_URL`, staging client ID (already configured in Phase 0)
- Firestore collections used: `queries` (write), `swiggy_sessions` (read-only in Phase 1)

---

## 6. Tests planned for this phase

- `parseIntent.test.ts` — mocked Gemini client, asserts schema-valid output for a handful of sample queries, and asserts the permissive fallback triggers on a malformed mock response.
- `normalize.test.ts` — fixed raw-Swiggy-response fixtures in → exact expected `NormalizedRestaurant`/`NormalizedMenuItem` out, so a future Swiggy response-shape change is caught here first.
- `rankResults.test.ts` — fixed normalized input + intent → deterministic expected ordering and scores, pinning the formula's behavior.
- Manual QA checklist (not automated): run ~10 varied NL queries against staging, confirm ranking order looks sane, confirm empty-result and reconnect-banner states both render correctly.

---

## 7. Explicitly out of scope for Phase 1

- Cart, coupons, order placement, order tracking (Phase 2).
- `restaurant_cache` short-TTL caching (Phase 3).
- Any mobile code (Phase 4).
- `ranking_feedback` collection / weight tuning loop (Phase 3) — `rankResults.ts` is written now assuming static weights only.
