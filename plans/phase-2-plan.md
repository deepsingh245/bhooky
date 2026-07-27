# Phase 2 Plan — Cart, Coupons, Real Orders (Staging) + Submit for Production Access

> Scope per `BHOOKY_BUILD_PLAN.md` §11: `update_food_cart`, `fetch_food_coupons`/`apply_food_coupon`, `get_food_cart`, `place_food_order` (COD), `track_food_order`. Cart UI enforces the ₹1000 cap and COD-only messaging. 401 → reconnect UX. Retry-with-backoff plus an idempotency check via `get_food_orders` before ever retrying `place_food_order`. Milestone: submit the Builders Club **production access** application once this is stable end-to-end with real testers.
>
> This document plans every file Phase 2 adds or touches, before any of it is written — same format as `plans/phase-1-plan.md`. Phase 1 shipped with `SWIGGY_MCP_MODE=mock` and a hardcoded `DEV_ADDRESS_ID`; Phase 2 is where real Swiggy staging access actually gets wired up for the first time.

---

## 0. What Phase 2 assumes from Phase 1, and the one gap it has to close first

Phase 1 built the `SwiggyMcpPort` abstraction, the mock client, `rankResults.ts` (with a neutral placeholder offer score, explicitly flagged for Phase 2), the reconnect-banner UI, and `getValidSwiggySession`/`SwiggySessionExpiredError` — all reusable as-is. What Phase 1 deliberately did **not** build: a real Swiggy OAuth connect flow. `swiggy_sessions` was only ever populated by a dev seed script, and `SwiggyReconnectBanner.tsx` links to a `/connect-swiggy` route that doesn't exist yet.

Phase 2 can't test cart/coupon/order flows against real staging without a real bearer token, so **the real OAuth 2.1 PKCE flow (`BHOOKY_BUILD_PLAN.md` §7) is the first thing this phase builds**, ahead of cart/coupons/orders. Everything else in this plan assumes that flow already works and a real token is sitting in `swiggy_sessions/{uid}`.

Second gap: Phase 1 hardcoded `DEV_ADDRESS_ID` because there was no address UI. Real cart/checkout calls need a real Swiggy `addressId`, so a minimal address-picker (backed by `get_addresses`, the same tool Swiggy's own docs use as the OAuth "hello world" check) is in scope here too — a small addition beyond `BHOOKY_BUILD_PLAN.md`'s literal Phase 2 bullet list, for the same reason `sessionStatusHandler.ts` was an unlisted-but-necessary addition in Phase 1.

---

## 1. Folder structure additions

```
apps/
  functions/
    src/
      swiggy/
        types.ts                  # touch: add cart/coupon/order/address methods to SwiggyMcpPort
        mockClient.ts              # touch: implement new methods over in-memory mock state
        liveClient.ts               # touch: implement new methods; verify Phase 1's shape assumptions for real
        session.ts                 # touch: add invalidateSwiggySession() for 401-triggered resets
        oauth/
          pkce.ts                  # code verifier + S256 challenge generation
          authorizeUrl.ts           # builds the /auth/authorize redirect URL
          exchangeToken.ts          # POST /auth/token code exchange
          oauthState.ts             # transient oauth_states Firestore doc (state -> verifier), consumed once
      http/
        oauthStartHandler.ts        # callable: returns the authorize URL + sets up oauth_states
        oauthCallbackHandler.ts     # plain HTTPS endpoint (Swiggy redirects the browser here directly)
        addressesHandler.ts         # callable: wraps get_addresses
        cartHandler.ts              # callable: get_food_cart + update_food_cart
        couponHandler.ts            # callable: fetch_food_coupons + apply_food_coupon
        orderHandler.ts             # callable: place_food_order (cap-enforced, idempotency-checked)
        trackOrderHandler.ts        # callable: track_food_order
      cart/
        cartTotals.ts               # pure function: subtotal/discount/delivery/total, ₹1000 cap check
        cartTotals.test.ts
      orders/
        orderRetry.ts               # retry-with-backoff + get_food_orders idempotency check
        orderRetry.test.ts
      ranking/
        rankResults.ts              # touch: replace NEUTRAL_OFFER_SCORE with real coupon-derived offer score
        rankResults.test.ts         # touch: add a coupon-affects-ranking case
      logging/
        logRankingFeedback.ts       # NEW: logs add-to-cart / place-order events (Phase 3 will consume these)
  web/
    src/
      pages/
        ConnectSwiggyPage.tsx        # real implementation of the /connect-swiggy placeholder from Phase 1
        CartPage.tsx
      components/
        AddressPicker.tsx
        CouponInput.tsx
        OrderStatusTracker.tsx
      hooks/
        useAddresses.ts
        useCart.ts
        useCoupons.ts
        useOrder.ts
      lib/
        apiClient.ts                 # touch: add callGetAddresses/callGetCart/callUpdateCart/
                                      # callFetchCoupons/callApplyCoupon/callPlaceOrder/callTrackOrder/callOauthStart
      components/FoodCard.tsx        # touch: add a real "Add to cart" action alongside the Phase 1 fallback link
      pages/SearchPage.tsx           # touch: wire address picker + add-to-cart into the existing search flow
packages/
  shared/
    src/
      types/
        address.ts                  # Address {id, label, line1, line2, isDefault}
        cart.ts                      # CartItem, Cart {items, subtotal, discount, deliveryFee, total, couponCode}
        coupon.ts                   # Coupon {code, description, discountAmount, isApplicable}
        order.ts                    # OrderStatus, Order, TrackOrderResponse
      constants/
        orderLimits.ts               # MAX_ORDER_TOTAL_RUPEES = 1000, TRACK_ORDER_MIN_POLL_INTERVAL_MS = 10_000
```

---

## 2. `packages/shared` additions

### `types/address.ts`
- `Address`: `id`, `label` (e.g. "Home", "Work"), `line1`, `line2`, `isDefault`. Normalized from `get_addresses`' raw response the same way Phase 1's `normalize.ts` handles restaurants/menu items.

### `types/cart.ts`
- `CartItem`: `menuItemId`, `name`, `price`, `quantity`.
- `Cart`: `restaurantId`, `items: CartItem[]`, `subtotal`, `discount`, `deliveryFee`, `total`, `couponCode: string | null`. This is Bhooky's normalized view of whatever `get_food_cart`/`update_food_cart` return.

### `types/coupon.ts`
- `Coupon`: `code`, `description`, `discountAmount`, `isApplicable` (a coupon can be *listed* by `fetch_food_coupons` but not valid for the current cart — surfaced so the UI can grey it out rather than let a doomed `apply_food_coupon` call round-trip first).

### `types/order.ts`
- `OrderStatus`: a union (`"placed" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled"`) — exact values reconciled against `track_food_order`'s real response once staging access exists (same "verify against real docs" caveat Phase 1 flagged for restaurant/menu shapes).
- `Order`: `id`, `status: OrderStatus`, `restaurantId`, `cartSnapshot: Cart`, `placedAt`.
- `TrackOrderResponse`: `orderId`, `status: OrderStatus`, `etaMinutes: number | null`.

### `constants/orderLimits.ts`
- `MAX_ORDER_TOTAL_RUPEES = 1000` — the Builders Club v1 hard cap (`BHOOKY_BUILD_PLAN.md` §8), checked both client-side (block checkout) and server-side (`orderHandler.ts` refuses to call `place_food_order` over cap even if the client check is bypassed).
- `TRACK_ORDER_MIN_POLL_INTERVAL_MS = 10_000` — Swiggy's stated minimum poll interval for `track_food_order`.

---

## 3. Real Swiggy OAuth 2.1 PKCE flow (`apps/functions/src/swiggy/oauth/`)

### `pkce.ts`
- `generatePkcePair(): { verifier: string; challenge: string }` — 32 random bytes, base64url-encoded verifier; SHA-256 hash of the verifier, base64url-encoded, as the challenge. Pure, deterministic given a fixed input — the one function in this folder that's trivially unit-testable without network/emulator access.

### `authorizeUrl.ts`
- `buildAuthorizeUrl({ challenge, state }): string` — assembles `https://mcp.swiggy.com/auth/authorize` with `client_id`, `redirect_uri`, `state`, `code_challenge`, `code_challenge_method=S256`, and `scope=mcp:tools mcp:resources mcp:prompts`, per `BHOOKY_BUILD_PLAN.md` §7.

### `oauthState.ts`
- `saveOauthState(state, verifier)` / `consumeOauthState(state)`: writes/reads a short-lived Firestore doc in a new `oauth_states` collection, keyed by the `state` param, so the verifier survives the redirect round-trip without trusting the client to hold it. `consumeOauthState` deletes the doc after reading it (single-use, CSRF-resistant) and throws if the state is unknown or already consumed.

### `exchangeToken.ts`
- `exchangeCodeForToken({ code, verifier }): Promise<{ token: string; expiresAt: number }>` — `POST /auth/token` with the code, verifier, and redirect URI; per §7 this returns a 5-day bearer token with **no refresh token** — `expiresAt` is computed as `now + 5 days` and written straight into `swiggy_sessions/{uid}` by the caller (`oauthCallbackHandler.ts`).

### `http/oauthStartHandler.ts`
- Callable. Requires `request.auth.uid` (same pattern as `searchHandler.ts`). Generates a PKCE pair, saves the verifier under a fresh `state` via `saveOauthState`, and returns `{ authorizeUrl }` for the frontend to redirect the whole page to.

### `http/oauthCallbackHandler.ts`
- A **plain HTTPS function**, not a callable — Swiggy's redirect lands the user's browser here directly with `?code=...&state=...` query params, so there's no Firebase Auth context to check yet. Looks up the verifier via `consumeOauthState(state)`, calls `exchangeCodeForToken`, writes `{ token, expiresAt }` to `swiggy_sessions/{uid}` — the `uid` was embedded in the `state`'s Firestore doc by `oauthStartHandler.ts` precisely so this step can recover it — then 302-redirects the browser back to the web app.

### `session.ts` (touch)
- Add `invalidateSwiggySession(userId)`: deletes `swiggy_sessions/{userId}`. Any live MCP call that comes back `401` (real revocation before the 5-day expiry, which Phase 1's expiry-only check can't catch) should call this so the *next* `getValidSwiggySession` fails fast without hitting Swiggy again, consistent with §7's "there is no silent refresh — treat any 401 as re-run authorization."

---

## 4. Extending the Swiggy MCP abstraction for cart/coupons/orders/addresses

### `swiggy/types.ts` (touch)
Add to `SwiggyMcpPort`: `getAddresses`, `getFoodCart`, `updateFoodCart`, `fetchFoodCoupons`, `applyFoodCoupon`, `placeFoodOrder`, `trackFoodOrder`, `getFoodOrders` — each with its own `Raw*Args`/`Raw*Response` pair, same placeholder-pending-real-docs caveat as Phase 1's restaurant/menu types.

### `swiggy/mockClient.ts` (touch)
- Needs actual mutable state now (Phase 1's mock was pure/stateless). Add a small in-memory `Map<userId, MockCartState>` inside the class instance so `updateFoodCart`/`getFoodCart` behave like a real session-scoped cart across calls within one emulator run. `fetchFoodCoupons` returns 2–3 fixture coupons (one always-applicable flat discount, one with a minimum-order-value `isApplicable: false` case to exercise the greyed-out UI path). `placeFoodOrder` returns a fake order id and flips to `"confirmed"` after a short delay the first time `trackFoodOrder` is polled, so `OrderStatusTracker.tsx` has something to visibly progress through during manual QA.

### `swiggy/liveClient.ts` (touch)
- Wire the same new methods through `callTool`. This is the first point where Phase 1's unverified assumptions (`structuredContent` vs text-block parsing, exact field names) get checked against a real server — budget time in this phase specifically to reconcile `swiggy/types.ts`'s `Raw*` shapes against what staging actually returns, for every tool, not just the two from Phase 1.

---

## 5. Cart

### `cart/cartTotals.ts`
- `computeCartTotals(items: CartItem[], coupon: Coupon | null): { subtotal, discount, deliveryFee, total }` — pure function, the one place cap/discount arithmetic lives. `deliveryFee` for Phase 2 can be a flat placeholder (Swiggy's real delivery-fee field, if `get_food_cart` exposes one, should override it — reconcile once staging is live, same pattern as other placeholder assumptions in this plan).
- Also exports `isOverOrderCap(total): boolean` against `MAX_ORDER_TOTAL_RUPEES`, used by both `orderHandler.ts` (server-side block) and `CartPage.tsx` (client-side block/warning).

### `http/cartHandler.ts`
- Callable, two operations behind one handler (or two handlers — decide based on how Firebase callable naming reads better; leaning toward `cartHandler` handling both `get` and `update` actions via a discriminated `action` field, mirroring how `search`/`sessionStatus` were kept as separate single-purpose callables in Phase 1 suggests **splitting into `getCartHandler.ts` / `updateCartHandler.ts` instead**, for consistency). Wraps `getValidSwiggySession` → `port.getFoodCart`/`port.updateFoodCart` → normalize into `Cart`.

---

## 6. Coupons

### `http/couponHandler.ts`
- Callable, `fetchFoodCoupons` and `applyFoodCoupon` (same split-vs-combined naming call as cart above — plan says `couponHandler.ts` for now, revisit if it reads awkwardly once written). Returns `Coupon[]` for listing, and an updated `Cart` (with `discount`/`total` recomputed) after applying one.

### `ranking/rankResults.ts` (touch)
- Replace the Phase 1 placeholder `offer: NEUTRAL_OFFER_SCORE` with a real per-restaurant offer score derived from `fetchFoodCoupons` results (e.g. best-available-discount-as-fraction-of-average-order-value, clamped 0–1). This requires `searchFood.ts` to also fetch coupon data per candidate restaurant alongside menus — a new fan-out call next to `getMenuForCandidates`, same concurrency-capped pattern.
- `rankResults.test.ts` (touch): add a case proving a restaurant with a strong coupon outranks an otherwise-identical one without, isolating the new offer-scoring logic the same way Phase 1's tests pinned budget/distance/rating.

---

## 7. Orders

### `orders/orderRetry.ts`
- `placeOrderWithIdempotencyCheck(port, cartId): Promise<Order>` — calls `port.placeFoodOrder`; on any 5xx, calls `port.getFoodOrders` **before** retrying to check whether the order actually went through (§8: `place_food_order` is not idempotent). Only retries (with exponential backoff, small fixed max attempts) if `get_food_orders` confirms no matching order exists yet.
- `orderRetry.test.ts` — mocked port: (1) success-first-try, (2) 5xx-then-get_food_orders-shows-it-succeeded (no duplicate call), (3) 5xx-then-get_food_orders-shows-nothing (retries once, then succeeds).

### `http/orderHandler.ts`
- Callable. Validates cart total against `isOverOrderCap` server-side (never trust the client-side block alone), then delegates to `placeOrderWithIdempotencyCheck`. On a live-mode 401 anywhere in this path, calls `invalidateSwiggySession` and throws the same `SWIGGY_RECONNECT_REQUIRED` shape `searchHandler.ts` already uses, so the existing `SwiggyReconnectBanner.tsx` handles it with zero frontend changes.

### `http/trackOrderHandler.ts`
- Callable wrapping `track_food_order`. Server-side, this is a thin pass-through; the `TRACK_ORDER_MIN_POLL_INTERVAL_MS` constraint is enforced client-side in `OrderStatusTracker.tsx`'s poll loop (Swiggy's own rate limit, not something the backend needs to re-police).

### `logging/logRankingFeedback.ts`
- `logRankingFeedback(userId, menuItemId, action: "added_to_cart" | "ordered")` — fire-and-forget write to a new `ranking_feedback` collection, same never-throw pattern as Phase 1's `logQuery.ts`. Phase 2 only *produces* this data; Phase 3 is what consumes it to tune `RANKING_WEIGHTS`.

---

## 8. Frontend

### `hooks/useAddresses.ts`
- Calls `addressesHandler`, exposes `{ addresses, selectedAddressId, selectAddress, loading }`. Replaces Phase 1's hardcoded `DEV_ADDRESS_ID` in `useSearch.ts` (touch: accept a real `addressId` param instead of the constant).

### `components/AddressPicker.tsx`
- Simple list/dropdown over `useAddresses`; shown once, above the search bar, before a first search can run (mirrors how `SwiggyReconnectBanner` gates search on session state).

### `hooks/useCart.ts`
- `{ cart, addItem, updateQuantity, loading }`, backed by `cartHandler`. `addItem` is what `FoodCard.tsx`'s new "Add to cart" button calls; also fires `logRankingFeedback(..., "added_to_cart")` server-side as part of the same handler (not a separate frontend call).

### `hooks/useCoupons.ts`
- `{ coupons, applyCoupon, loading }` backed by `couponHandler`.

### `hooks/useOrder.ts`
- `{ order, placeOrder, trackingStatus }`. `placeOrder` calls `orderHandler`; once an order id exists, an internal poll loop (respecting `TRACK_ORDER_MIN_POLL_INTERVAL_MS`) calls `trackOrderHandler` and updates `trackingStatus`.

### `pages/CartPage.tsx`
- Cart line items with quantity controls, `CouponInput`, subtotal/discount/total breakdown, a persistent **"Cash on Delivery only"** notice, a blocking banner + disabled checkout button when `isOverOrderCap(total)` is true, and the checkout action wired to `useOrder().placeOrder`.

### `components/CouponInput.tsx`
- Text input + apply button over `useCoupons`; lists fetched coupons with `isApplicable` styling (greyed out, per §types/coupon.ts above) rather than letting the user attempt an apply call that's guaranteed to fail.

### `components/OrderStatusTracker.tsx`
- Renders `trackingStatus` from `useOrder`; a simple status stepper (placed → confirmed → preparing → out for delivery → delivered), not a map/live-location view (that's beyond what `track_food_order` needs to provide for an MVP).

### `pages/ConnectSwiggyPage.tsx`
- Real implementation of the Phase 1 placeholder route: a single "Connect your Swiggy account" button that calls `oauthStartHandler` and does a full-page redirect (`window.location.href = authorizeUrl`) — not a fetch/XHR, since this has to leave the SPA entirely for Swiggy's own OTP page.

### `lib/apiClient.ts` (touch)
- Add thin `httpsCallable` wrappers for every new handler above, following the exact pattern Phase 1 established for `callSearchFood`/`callSessionStatus`.

---

## 9. Firestore

New collections, same posture as Phase 1 (`firestore.rules` stays deny-all for direct client access — every read/write goes through the Admin SDK inside Cloud Functions):
- **`carts`** — optimistic local staging cart, synced to Swiggy's real cart via `update_food_cart`.
- **`oauth_states`** — transient, single-use, short-TTL PKCE state→verifier mapping.
- **`orders`** — local record of placed orders + last known tracking status.
- **`ranking_feedback`** — add-to-cart/order events; write-only in Phase 2, read by Phase 3's weight-tuning job.

No new composite indexes expected (all single-document lookups keyed by `userId` or `state`), same as Phase 1 — revisit `firestore.indexes.json` only if a query pattern actually needs one once these are implemented.

---

## 10. Tests planned for this phase

- `pkce.test.ts` — verifier/challenge generation is well-formed base64url and the challenge is the correct SHA-256 of the verifier.
- `cartTotals.test.ts` — subtotal/discount/total arithmetic, and `isOverOrderCap` at/under/over the ₹1000 boundary.
- `orderRetry.test.ts` — the three idempotency-check scenarios described in §7.
- `rankResults.test.ts` (extended) — coupon-driven offer score changes ranking order as expected.
- Manual QA checklist (not automated, requires real staging credentials): full connect → search → add to cart → apply coupon → place COD order under cap → track to a terminal status; separately, confirm a cart total over ₹1000 is blocked both client- and server-side; separately, force a `401` (e.g. revoke via Swiggy's own account settings if possible, or simulate in mock mode) and confirm the reconnect banner appears and a fresh connect resolves it.

---

## 11. Explicitly out of scope for Phase 2

- Tuning `RANKING_WEIGHTS` from `ranking_feedback` data (Phase 3) — this phase only writes the data.
- `restaurant_cache` short-TTL caching (Phase 3).
- Any mobile code (Phase 4).
- Online payment — not available in Swiggy's v1 MCP order path at all (COD-only is a Swiggy-side constraint, not a Bhooky choice).
- Raising the ₹1000 cap or requesting a rate-limit increase — a Swiggy-side negotiation, not something this phase's code can affect; the cap is enforced, not challenged.
- Actually submitting/negotiating the Builders Club production-access application — a manual business step that happens *after* this phase's code is stable with real testers, not a code deliverable itself.
