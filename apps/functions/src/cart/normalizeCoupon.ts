import type { Coupon } from "@bhooky/shared";
import type { RawSwiggyCoupon } from "../swiggy/types.js";

export function normalizeCoupon(raw: RawSwiggyCoupon, isApplicable: boolean): Coupon {
  return { code: raw.code, description: raw.description, discountAmount: raw.discountAmount, isApplicable };
}
