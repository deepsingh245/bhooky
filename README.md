# Bhooky — Phase 1

Read-only AI food-search MVP: natural-language query → Gemini-parsed intent →
Swiggy Food MCP search/menu data → Bhooky's own ranking → ranked food cards.
No cart/order/coupons yet (Phase 2). See `BHOOKY_BUILD_PLAN.md` and
`plans/phase-1-plan.md` for the full scope, and
`C:\Users\simra\.claude\plans\plan-phase-1-stateless-wilkinson.md` for the
implementation plan this codebase follows.

Runs entirely on Firebase's local emulator suite for Phase 1 — no real
Firebase/GCP project needed. Swiggy data comes from a fixture-backed mock
client by default (see "Going live" below).

## One-time setup

```bash
npm install
cp .env.example apps/functions/.env
```

Edit `apps/functions/.env` and fill in `GEMINI_API_KEY` with your real Gemini
API key (https://aistudio.google.com/apikey). Leave `SWIGGY_MCP_MODE=mock`.

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
emulator automatically. Open the browser console and copy the UID logged as
`[bhooky dev] Firebase Auth UID: ...`.

**Terminal 3 — seed a fake Swiggy session** (search fails with a reconnect
banner until this exists):

```bash
npm run seed -w apps/functions -- <uid-you-copied>
```

Refresh the page and search — e.g. *"something spicy vegetarian under 300 for
late night"*. You should see ranked food cards from the 5 mock restaurants.

## Manual QA checklist

- A handful of varied queries return sensibly-ranked results (try a veg query,
  a budget constraint, "late night", and a query nothing matches).
- Delete the seeded doc in the Emulator UI (Firestore → `swiggy_sessions`) and
  search again — the reconnect banner should appear instead of a broken error.
- Clicking a filter chip (food type / time) re-runs the search with that
  filter changed.

## Tests

```bash
npm test
```

Runs `normalize.test.ts`, `rankResults.test.ts`, and `parseIntent.test.ts`
(Gemini mocked) in `apps/functions`.

## Going live with real Swiggy data

Once you have Builders Club staging credentials: set `SWIGGY_MCP_MODE=live`
and `SWIGGY_MCP_BASE_URL` in `apps/functions/.env`, and make sure a real
bearer token ends up in Firestore's `swiggy_sessions/{uid}` (via the actual
OAuth PKCE flow — not built yet, this only swaps the data source). Nothing
else changes: `swiggy/mcpClient.ts` picks `LiveSwiggyMcpClient` automatically.
Before trusting it in a demo, smoke-test `liveClient.ts` against the real
server — its request/response shape assumptions are unverified placeholders
(see the comments in `apps/functions/src/swiggy/types.ts` and `liveClient.ts`).
