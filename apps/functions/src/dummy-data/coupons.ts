import type { RawSwiggyCoupon } from "../swiggy/types.js";

// One always-applicable coupon and one with a minimum-order-value gate, so
// CouponInput.tsx has a real greyed-out ("not applicable yet") case to render.
export const MOCK_COUPONS: RawSwiggyCoupon[] = [
  { code: "FLAT50", description: "Flat ₹50 off", discountAmount: 50, minOrderValueRupees: null },
  { code: "MIN300GET20", description: "₹20 off on orders above ₹300", discountAmount: 20, minOrderValueRupees: 300 },
];
