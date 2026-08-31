# Bhooky

AI food-search + ordering demo: natural-language query → parsed intent →
Swiggy Food MCP search/menu data → Bhooky's own ranking → ranked food cards →
cart → coupons → COD order placement + tracking. See `BHOOKY_BUILD_PLAN.md`,
`plans/phase-1-plan.md`, and `plans/phase-2-plan.md` for the full scope, and
`C:\Users\simra\.claude\plans\plan-phase-1-stateless-wilkinson.md` for the
implementation plan this codebase follows.

Runs entirely on Firebase's local emulator suite — no real Firebase/GCP
project needed. **Everything is mock-backed by default: no Gemini API key, no
Swiggy credentials, no manual seed step.** Swiggy data comes from a
fixture-backed mock client (`apps/functions/src/dummy-data/`), and intent
parsing comes from a local keyword-based mock parser — see "Going live" below
to swap either one for the real thing.

## One-time setup

```bash
npm install
cp .env.example apps/functions/.env
```

The defaults in `apps/functions/.env` (`SWIGGY_MCP_MODE=mock`,
`GEMINI_MODE=mock`) need no further editing to run the demo. `GEMINI_API_KEY`
only matters once `GEMINI_MODE=live`.

Build the shared types package once (also rebuilds automatically if you use
`npx tsc -b -w` at the repo root while developing):

```bash
npm run build -w packages/shared
```

## Running it

**Terminal 1 — emulators:**

```bash
npm run emulators
```

Waits for `All emulators ready!`. Emulator UI: http://127.0.0.1:4010.

> Ports were moved off Firebase's defaults (functions 5501, firestore 8081,
> UI 4010, hub 4410, logging 4510 — auth stays at the default 9099) because
> another emulator instance was already running on this machine during
> Phase 1 development. If that's no longer true on your machine, you can move
> them back in `firebase.json` (and update the ports hardcoded in
> `apps/web/src/lib/firebase.ts` and `apps/functions/scripts/seedSwiggySession.ts`
> to match).

**Terminal 2 — frontend:**

```bash
npm run dev
```

Open http://localhost:5173. The app signs in anonymously against the Auth
emulator automatically — no manual seed step needed. A "Reconnect Swiggy"
banner appears once (no Swiggy session exists yet for this fresh anonymous
user); click **Connect Swiggy**, which resolves instantly in mock mode (no
real redirect, no phone/OTP page), and the banner disappears.

Search something like *"something spicy vegetarian under 300 for late
night"* — you should see ranked food cards from the 5 mock restaurants,
actually filtered by the parsed intent. From there: add an item to your cart,
apply the `FLAT50` coupon (or try `MIN300GET20` below its ₹300 minimum to see
it greyed out), and place a Cash-on-Delivery order under the ₹1000 cap to
watch `OrderStatusTracker` progress through statuses over ~2.5 minutes.

`npm run seed -w apps/functions -- <uid>` still exists as an optional
alternative to clicking "Connect Swiggy" (e.g. for scripting/CI use) — it's no
longer required for normal local development.

## Manual QA checklist

- A handful of varied queries return sensibly-ranked results (try a veg query,
  a budget constraint, "late night", and a query nothing matches).
- Delete the `swiggy_sessions/{uid}` doc in the Emulator UI (Firestore) mid-session
  and retry any action — the reconnect banner should reappear, and a fresh
  "Connect Swiggy" click should resolve it again with no leftover broken state.
- Add an item to cart, apply a coupon, place a COD order under ₹1000, and
  confirm the order-status tracker progresses through statuses over time.
- Attempt to check out over ₹1000 — the checkout button should be disabled.
- Clicking a filter chip (food type / time) re-runs the search with that
  filter changed.

## Tests

```bash
npm test
```

Runs the full `apps/functions` suite — `normalize.test.ts`,
`rankResults.test.ts`, `cartTotals.test.ts`, `orderRetry.test.ts`,
`mockClient.test.ts`, `parseIntentMock.test.ts` (the mock intent parser), and
`parseIntent.test.ts` (the real Gemini path, mocked) — plus `apps/web`'s suite.

## Going live with real data

**Swiggy:** once you have Builders Club staging credentials, set
`SWIGGY_MCP_MODE=live` and `SWIGGY_MCP_BASE_URL`/`SWIGGY_OAUTH_CLIENT_ID`/
`SWIGGY_OAUTH_REDIRECT_URI` in `apps/functions/.env`. "Connect Swiggy" then
runs the real OAuth 2.1 PKCE flow instead of the mock short-circuit. Nothing
else changes: `swiggy/mcpClient.ts` picks `LiveSwiggyMcpClient` automatically.
Before trusting it in a demo, smoke-test `liveClient.ts` against the real
server — its request/response shape assumptions are unverified placeholders
(see the comments in `apps/functions/src/swiggy/types.ts` and `liveClient.ts`).

**Gemini:** set `GEMINI_MODE=live` and fill in a real `GEMINI_API_KEY`
(https://aistudio.google.com/apikey) in `apps/functions/.env` to replace the
local keyword-based mock parser with real Gemini structured-output parsing.
