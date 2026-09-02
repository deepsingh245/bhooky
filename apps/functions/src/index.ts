// MUST be the first import — sets the global region (asia-south1) as a side
// effect before any handler module below is evaluated. ESM hoists these
// `export { x } from "./..."` re-exports and evaluates them in source order, so
// this side-effect import runs before every onCall() is defined. See
// globalOptions.ts for the full explanation.
import "./globalOptions.js";

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
