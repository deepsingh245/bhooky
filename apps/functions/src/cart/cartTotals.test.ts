import { describe, expect, it } from "vitest";
import type { RawSwiggyCartItem, RawSwiggyCoupon } from "../swiggy/types.js";
import { computeCartTotals, isCouponApplicable, isOverOrderCap } from "./cartTotals.js";

const items: RawSwiggyCartItem[] = [{ menuItemId: "m1", name: "Item", price: 200, quantity: 2 }];

const flatCoupon: RawSwiggyCoupon = {
  code: "FLAT50",
  description: "Flat 50 off",
  discountAmount: 50,
  minOrderValueRupees: null,
};

const minOrderCoupon: RawSwiggyCoupon = {
  code: "MIN300GET20",
  description: "20 off above 300",
  discountAmount: 20,
  minOrderValueRupees: 1000,
};

describe("computeCartTotals", () => {
  it("computes subtotal/delivery/total with no coupon", () => {
    expect(computeCartTotals(items, null)).toEqual({ subtotal: 400, discount: 0, deliveryFee: 30, total: 430 });
  });

  it("applies a flat coupon with no minimum", () => {
    expect(computeCartTotals(items, flatCoupon).discount).toBe(50);
  });

  it("ignores a coupon whose minimum order value isn't met", () => {
    expect(computeCartTotals(items, minOrderCoupon).discount).toBe(0);
  });

  it("returns zero totals for an empty cart", () => {
    expect(computeCartTotals([], null)).toEqual({ subtotal: 0, discount: 0, deliveryFee: 0, total: 0 });
  });
});

describe("isCouponApplicable", () => {
  it("is true with no minimum", () => {
    expect(isCouponApplicable(flatCoupon, 0)).toBe(true);
  });

  it("respects the minimum order value boundary", () => {
    const coupon: RawSwiggyCoupon = { ...minOrderCoupon, minOrderValueRupees: 300 };
    expect(isCouponApplicable(coupon, 299)).toBe(false);
    expect(isCouponApplicable(coupon, 300)).toBe(true);
  });
});

describe("isOverOrderCap", () => {
  it("allows exactly the cap", () => {
    expect(isOverOrderCap(1000)).toBe(false);
  });

  it("blocks one rupee over the cap", () => {
    expect(isOverOrderCap(1001)).toBe(true);
  });
});
