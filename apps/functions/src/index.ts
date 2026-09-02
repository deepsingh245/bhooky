import { setGlobalOptions } from "firebase-functions/v2/options";

// BHOOKY_BUILD_PLAN.md §1 mandates asia-south1 for data-residency reasons.
// Pinned before real Swiggy OAuth redirect URI registration, since that URI
// is tied to this region-qualified deployed function URL — changing it later
// would mean re-registering with Swiggy.
setGlobalOptions({ region: "asia-south1" });

// Every deployed function name is prefixed "bhooky" — this project shares a
// single real Firebase project with other apps, so function names (which are
// global within one project, regardless of codebase) must not collide with
// theirs.
export { searchHandler as bhookySearchHandler } from "./http/searchHandler.js";
export { sessionStatusHandler as bhookySessionStatusHandler } from "./http/sessionStatusHandler.js";
export { getAddressesHandler as bhookyGetAddressesHandler } from "./http/getAddressesHandler.js";
export { getCartHandler as bhookyGetCartHandler } from "./http/getCartHandler.js";
export { updateCartHandler as bhookyUpdateCartHandler } from "./http/updateCartHandler.js";
export { getCouponsHandler as bhookyGetCouponsHandler } from "./http/getCouponsHandler.js";
export { applyCouponHandler as bhookyApplyCouponHandler } from "./http/applyCouponHandler.js";
export { orderHandler as bhookyOrderHandler } from "./http/orderHandler.js";
export { trackOrderHandler as bhookyTrackOrderHandler } from "./http/trackOrderHandler.js";
export { oauthStartHandler as bhookyOauthStartHandler } from "./http/oauthStartHandler.js";
export { oauthCallbackHandler as bhookyOauthCallbackHandler } from "./http/oauthCallbackHandler.js";
