import type { RawSwiggyCoupon } from "../swiggy/types.js";

// Placeholder "typical order value" until real order-value analytics exist —
// flagged for reconciliation alongside other Raw* placeholder assumptions
// once SWIGGY_MCP_MODE=live is exercised against staging.
const REFERENCE_ORDER_VALUE_RUPEES = 300;

// Best-available-discount-as-fraction-of-a-reference-order-value, clamped 0-1.
export function computeOfferScore(coupons: RawSwiggyCoupon[]): number {
  const bestDiscount = findBestOfferCoupon(coupons)?.discountAmount ?? 0;
  return Math.max(0, Math.min(1, bestDiscount / REFERENCE_ORDER_VALUE_RUPEES));
}

// The winning coupon behind computeOfferScore's float, kept alongside it so
// the UI can render an actual "₹X off" badge instead of just the derived
// ranking signal. Same "meets reference order value" filter as the score —
// only counts coupons whose minimum order value wouldn't already exclude a
// typical order, since there's no real cart total to check against yet at
// search/ranking time.
export function findBestOfferCoupon(coupons: RawSwiggyCoupon[]): RawSwiggyCoupon | null {
  return coupons.reduce<RawSwiggyCoupon | null>((best, coupon) => {
    const meetsReferenceOrder =
      coupon.minOrderValueRupees === null || coupon.minOrderValueRupees <= REFERENCE_ORDER_VALUE_RUPEES;
    if (!meetsReferenceOrder) return best;
    return !best || coupon.discountAmount > best.discountAmount ? coupon : best;
  }, null);
}
