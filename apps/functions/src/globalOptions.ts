import { setGlobalOptions } from "firebase-functions/v2/options";

// BHOOKY_BUILD_PLAN.md §1 mandates asia-south1 for data-residency reasons.
// Pinned before real Swiggy OAuth redirect URI registration, since that URI
// is tied to this region-qualified deployed function URL — changing it later
// would mean re-registering with Swiggy.
//
// This lives in its own side-effect module (imported first by index.ts) because
// ES modules hoist and evaluate every `export { x } from "./handler.js"` re-export
// BEFORE any top-level statement in index.ts. Calling setGlobalOptions() inline
// in index.ts therefore ran AFTER every onCall() had already been defined at the
// default region (us-central1). Importing this module first guarantees the region
// is set before any handler module — and its onCall() calls — is evaluated.
setGlobalOptions({ region: "asia-south1" });
