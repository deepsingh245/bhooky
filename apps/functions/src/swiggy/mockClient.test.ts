import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockSwiggyMcpClient } from "./mockClient.js";

// Each test uses its own bearer token — the mock's cart/order maps are
// module-scoped (they must survive a fresh client per handler call, see
// mockClient.ts's comment), so a shared token across tests would leak state.
let tokenCounter = 0;
function freshToken(): string {
  tokenCounter += 1;
  return `test-token-${tokenCounter}`;
}

describe("MockSwiggyMcpClient cart", () => {
  it("adds an item to an empty cart", async () => {
    const client = new MockSwiggyMcpClient(freshToken());
    const cart = await client.updateFoodCart({
      restaurantId: "r1",
      menuItemId: "r1-m1",
      name: "Dal Makhani",
      price: 180,
      quantity: 2,
      addressId: "addr-home",
    });

    expect(cart.restaurantId).toBe("r1");
    expect(cart.items).toEqual([{ menuItemId: "r1-m1", name: "Dal Makhani", price: 180, quantity: 2 }]);
    expect(cart.subtotal).toBe(360);
  });

  it("replaces the cart when adding an item from a different restaurant", async () => {
    const token = freshToken();
    const client = new MockSwiggyMcpClient(token);
    await client.updateFoodCart({
      restaurantId: "r1",
      menuItemId: "r1-m1",
      name: "Dal Makhani",
      price: 180,
      quantity: 1,
      addressId: "addr-home",
    });

    const cart = await client.updateFoodCart({
      restaurantId: "r2",
      menuItemId: "r2-m1",
      name: "Sprout Salad",
      price: 99,
      quantity: 1,
      addressId: "addr-home",
    });

    expect(cart.restaurantId).toBe("r2");
    expect(cart.items).toEqual([{ menuItemId: "r2-m1", name: "Sprout Salad", price: 99, quantity: 1 }]);
  });

  it("removes an item when quantity is set to 0 and clears the cart when empty", async () => {
    const token = freshToken();
    const client = new MockSwiggyMcpClient(token);
    await client.updateFoodCart({
      restaurantId: "r1",
      menuItemId: "r1-m1",
      name: "Dal Makhani",
      price: 180,
      quantity: 1,
      addressId: "addr-home",
    });

    const cart = await client.updateFoodCart({
      restaurantId: "r1",
      menuItemId: "r1-m1",
      name: "Dal Makhani",
      price: 180,
      quantity: 0,
      addressId: "addr-home",
    });

    expect(cart.items).toEqual([]);
    expect(cart.restaurantId).toBeNull();
  });

  it("getFoodCart returns a fresh empty cart before anything is added", async () => {
    const client = new MockSwiggyMcpClient(freshToken());
    const cart = await client.getFoodCart({ addressId: "addr-home" });
    expect(cart).toEqual({
      restaurantId: null,
      items: [],
      subtotal: 0,
      discount: 0,
      deliveryFee: 0,
      total: 0,
      couponCode: null,
    });
  });
});

describe("MockSwiggyMcpClient coupons", () => {
  it("applies an always-applicable coupon", async () => {
    const token = freshToken();
    const client = new MockSwiggyMcpClient(token);
    await client.updateFoodCart({
      restaurantId: "r1",
      menuItemId: "r1-m1",
      name: "Dal Makhani",
      price: 180,
      quantity: 1,
      addressId: "addr-home",
    });

    const cart = await client.applyFoodCoupon({ restaurantId: "r1", addressId: "addr-home", code: "FLAT50" });
    expect(cart.couponCode).toBe("FLAT50");
    expect(cart.discount).toBe(50);
  });

  it("rejects a coupon whose minimum order value isn't met", async () => {
    const token = freshToken();
    const client = new MockSwiggyMcpClient(token);
    await client.updateFoodCart({
      restaurantId: "r1",
      menuItemId: "r1-m1",
      name: "Dal Makhani",
      price: 180,
      quantity: 1,
      addressId: "addr-home",
    });

    await expect(
      client.applyFoodCoupon({ restaurantId: "r1", addressId: "addr-home", code: "MIN300GET20" }),
    ).rejects.toThrow(/not applicable/);
  });
});

describe("MockSwiggyMcpClient orders", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("progresses trackFoodOrder status as time elapses", async () => {
    const client = new MockSwiggyMcpClient(freshToken());
    const order = await client.placeFoodOrder({ restaurantId: "r1", addressId: "addr-home" });

    expect((await client.trackFoodOrder({ orderId: order.orderId })).status).toBe("placed");

    vi.advanceTimersByTime(20_000);
    expect((await client.trackFoodOrder({ orderId: order.orderId })).status).toBe("confirmed");

    vi.advanceTimersByTime(200_000);
    expect((await client.trackFoodOrder({ orderId: order.orderId })).status).toBe("delivered");
  });

  it("getFoodOrders only returns orders placed at/after the given timestamp", async () => {
    const client = new MockSwiggyMcpClient(freshToken());
    const before = Date.now();
    const order = await client.placeFoodOrder({ restaurantId: "r1", addressId: "addr-home" });

    const sinceBefore = await client.getFoodOrders({ sinceTimestamp: before });
    expect(sinceBefore.orders.map((o) => o.orderId)).toContain(order.orderId);

    const sinceAfter = await client.getFoodOrders({ sinceTimestamp: order.placedAt + 1 });
    expect(sinceAfter.orders).toEqual([]);
  });
});
