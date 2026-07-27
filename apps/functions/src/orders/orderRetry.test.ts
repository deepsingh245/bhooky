import { describe, expect, it, vi } from "vitest";
import type { PlaceOrderArgs, RawSwiggyOrder, SwiggyMcpPort } from "../swiggy/types.js";
import { placeOrderWithIdempotencyCheck } from "./orderRetry.js";

const args: PlaceOrderArgs = { restaurantId: "r1", addressId: "addr-home" };

function makeOrder(overrides: Partial<RawSwiggyOrder> = {}): RawSwiggyOrder {
  return { orderId: "order-1", restaurantId: "r1", totalRupees: 400, placedAt: Date.now(), ...overrides };
}

function makePort(overrides: Partial<SwiggyMcpPort>): SwiggyMcpPort {
  return {
    searchRestaurants: vi.fn(),
    getRestaurantMenu: vi.fn(),
    getAddresses: vi.fn(),
    getFoodCart: vi.fn(),
    updateFoodCart: vi.fn(),
    fetchFoodCoupons: vi.fn(),
    applyFoodCoupon: vi.fn(),
    placeFoodOrder: vi.fn(),
    trackFoodOrder: vi.fn(),
    getFoodOrders: vi.fn(),
    ...overrides,
  };
}

describe("placeOrderWithIdempotencyCheck", () => {
  it("returns the order on the first successful attempt", async () => {
    const order = makeOrder();
    const port = makePort({ placeFoodOrder: vi.fn().mockResolvedValue(order) });

    const result = await placeOrderWithIdempotencyCheck(port, args);

    expect(result).toEqual(order);
    expect(port.getFoodOrders).not.toHaveBeenCalled();
  });

  it("returns the existing order without retrying when get_food_orders shows it already succeeded", async () => {
    const order = makeOrder();
    const placeFoodOrder = vi.fn().mockRejectedValue(new Error("upstream 500"));
    const port = makePort({
      placeFoodOrder,
      getFoodOrders: vi.fn().mockResolvedValue({ orders: [order] }),
    });

    const result = await placeOrderWithIdempotencyCheck(port, args);

    expect(result).toEqual(order);
    expect(placeFoodOrder).toHaveBeenCalledTimes(1);
  });

  it("retries once and succeeds when get_food_orders shows nothing went through yet", async () => {
    const order = makeOrder();
    const placeFoodOrder = vi.fn().mockRejectedValueOnce(new Error("upstream 500")).mockResolvedValueOnce(order);
    const port = makePort({
      placeFoodOrder,
      getFoodOrders: vi.fn().mockResolvedValue({ orders: [] }),
    });

    const result = await placeOrderWithIdempotencyCheck(port, args);

    expect(result).toEqual(order);
    expect(placeFoodOrder).toHaveBeenCalledTimes(2);
  });
});
