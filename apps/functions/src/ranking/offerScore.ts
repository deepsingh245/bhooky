import type { RawSwiggyCoupon } from "../swiggy/types.js";

// Placeholder "typical order value" until real order-value analytics exist —
// flagged for reconciliation alongside other Raw* placeholder assumptions
// once SWIGGY_MCP_MODE=live is exercised against staging.
const REFERENCE_ORDER_VALUE_RUPEES = 300;

// Best-available-discount-as-fraction-of-a-reference-order-value, clamped 0-1.
// Only counts coupons whose minimum order value wouldn't already exclude a
// typical order, since there's no real cart total to check against yet at
// search/ranking time.
export function computeOfferScore(coupons: RawSwiggyCoupon[]): number {
  const bestDiscount = coupons.reduce((best, coupon) => {
    const meetsReferenceOrder =
      coupon.minOrderValueRupees === null || coupon.minOrderValueRupees <= REFERENCE_ORDER_VALUE_RUPEES;
    return meetsReferenceOrder ? Math.max(best, coupon.discountAmount) : best;
  }, 0);

  return Math.max(0, Math.min(1, bestDiscount / REFERENCE_ORDER_VALUE_RUPEES));
}
