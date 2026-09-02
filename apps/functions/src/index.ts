import { setGlobalOptions } from "firebase-functions/v2/options";

// BHOOKY_BUILD_PLAN.md §1 mandates asia-south1 for data-residency reasons.
// Pinned before real Swiggy OAuth redirect URI registration, since that URI
// is tied to this region-qualified deployed function URL — changing it later
// would mean re-registering with Swiggy.
setGlobalOptions({ region: "asia-south1" });

export { searchHandler } from "./http/searchHandler.js";
export { sessionStatusHandler } from "./http/sessionStatusHandler.js";
export { getAddressesHandler } from "./http/getAddressesHandler.js";
export { getCartHandler } from "./http/getCartHandler.js";
export { updateCartHandler } from "./http/updateCartHandler.js";
export { getCouponsHandler } from "./http/getCouponsHandler.js";
export { applyCouponHandler } from "./http/applyCouponHandler.js";
export { orderHandler } from "./http/orderHandler.js";
export { trackOrderHandler } from "./http/trackOrderHandler.js";
export { oauthStartHandler } from "./http/oauthStartHandler.js";
export { oauthCallbackHandler } from "./http/oauthCallbackHandler.js";
