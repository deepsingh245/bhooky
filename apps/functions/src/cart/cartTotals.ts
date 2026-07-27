import { MAX_ORDER_TOTAL_RUPEES } from "@bhooky/shared";
import type { RawSwiggyCartItem, RawSwiggyCoupon } from "../swiggy/types.js";

// Phase 2 placeholder — Swiggy's real get_food_cart delivery fee should override
// this once SWIGGY_MCP_MODE=live is exercised, same caveat as other Raw* shapes.
const FLAT_DELIVERY_FEE_RUPEES = 30;

export interface CartTotals {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}

export function computeCartTotals(items: RawSwiggyCartItem[], coupon: RawSwiggyCoupon | null): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = coupon && isCouponApplicable(coupon, subtotal) ? coupon.discountAmount : 0;
  const deliveryFee = items.length > 0 ? FLAT_DELIVERY_FEE_RUPEES : 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  return { subtotal, discount, deliveryFee, total };
}

export function isCouponApplicable(coupon: RawSwiggyCoupon, subtotal: number): boolean {
  return coupon.minOrderValueRupees === null || subtotal >= coupon.minOrderValueRupees;
}

export function isOverOrderCap(total: number): boolean {
  return total > MAX_ORDER_TOTAL_RUPEES;
}
