import { computeCartTotals, isCouponApplicable } from "../cart/cartTotals.js";
import {
  MOCK_ADDRESSES,
  MOCK_COUPONS,
  MOCK_MENUS_BY_RESTAURANT_ID,
  MOCK_RESTAURANTS,
} from "../dummy-data/index.js";
import type {
  ApplyCouponArgs,
  FetchCouponsArgs,
  GetCartArgs,
  GetFoodOrdersArgs,
  GetMenuArgs,
  PlaceOrderArgs,
  RawSwiggyAddressesResponse,
  RawSwiggyCart,
  RawSwiggyCartItem,
  RawSwiggyCouponsResponse,
  RawSwiggyMenuResponse,
  RawSwiggyOrder,
  RawSwiggyOrdersResponse,
  RawSwiggySearchResponse,
  RawSwiggyTrackOrderResponse,
  SearchRestaurantsArgs,
  SwiggyMcpPort,
  TrackOrderArgs,
  UpdateCartArgs,
} from "./types.js";

interface MockCartState {
  restaurantId: string | null;
  items: RawSwiggyCartItem[];
  couponCode: string | null;
}

// Module-scoped, not instance-scoped: mcpClient.ts's getSwiggyMcpClient() builds a
// fresh MockSwiggyMcpClient on every single handler call, so any state kept on the
// instance would reset before the next call ever saw it. Keying by bearer token
// keeps different (mock) users' carts/orders from colliding in the same emulator.
const mockCartsByToken = new Map<string, MockCartState>();
const mockOrdersByToken = new Map<string, RawSwiggyOrder[]>();

const ORDER_STATUS_THRESHOLDS_MS: Array<{ maxElapsedMs: number; status: string }> = [
  { maxElapsedMs: 15_000, status: "placed" },
  { maxElapsedMs: 45_000, status: "confirmed" },
  { maxElapsedMs: 90_000, status: "preparing" },
  { maxElapsedMs: 150_000, status: "out_for_delivery" },
];

// Ignores real query semantics for search/menu — the point of mock mode is to
// decouple "does search -> rank -> render work" from "is Swiggy OAuth/staging
// access set up yet." See the mock/live selection in mcpClient.ts.
export class MockSwiggyMcpClient implements SwiggyMcpPort {
  constructor(private readonly bearerToken: string) {}

  async searchRestaurants(_args: SearchRestaurantsArgs): Promise<RawSwiggySearchResponse> {
    return { restaurants: MOCK_RESTAURANTS };
  }

  async getRestaurantMenu(args: GetMenuArgs): Promise<RawSwiggyMenuResponse> {
    const items = MOCK_MENUS_BY_RESTAURANT_ID[args.restaurantId] ?? [];
    return { restaurantId: args.restaurantId, items };
  }

  async getAddresses(): Promise<RawSwiggyAddressesResponse> {
    return { addresses: MOCK_ADDRESSES };
  }

  async getFoodCart(_args: GetCartArgs): Promise<RawSwiggyCart> {
    return this.toRawCart(this.getOrCreateCart());
  }

  async updateFoodCart(args: UpdateCartArgs): Promise<RawSwiggyCart> {
    const cart = this.getOrCreateCart();

    // Swiggy carts hold items from one restaurant at a time — switching
    // restaurants replaces the cart rather than erroring, so the UI flow never
    // gets stuck on a "can't mix restaurants" dead end.
    if (cart.restaurantId && cart.restaurantId !== args.restaurantId) {
      cart.items = [];
      cart.couponCode = null;
    }
    cart.restaurantId = args.restaurantId;

    const existingIndex = cart.items.findIndex((item) => item.menuItemId === args.menuItemId);
    if (args.quantity <= 0) {
      if (existingIndex >= 0) cart.items.splice(existingIndex, 1);
    } else if (existingIndex >= 0) {
      const existing = cart.items[existingIndex];
      if (existing) cart.items[existingIndex] = { ...existing, quantity: args.quantity };
    } else {
      cart.items.push({ menuItemId: args.menuItemId, name: args.name, price: args.price, quantity: args.quantity });
    }

    if (cart.items.length === 0) {
      cart.restaurantId = null;
      cart.couponCode = null;
    }

    return this.toRawCart(cart);
  }

  async fetchFoodCoupons(_args: FetchCouponsArgs): Promise<RawSwiggyCouponsResponse> {
    return { coupons: MOCK_COUPONS };
  }

  async applyFoodCoupon(args: ApplyCouponArgs): Promise<RawSwiggyCart> {
    const cart = this.getOrCreateCart();
    const coupon = MOCK_COUPONS.find((candidate) => candidate.code === args.code);
    if (!coupon) throw new Error(`Unknown coupon code: ${args.code}`);

    const { subtotal } = computeCartTotals(cart.items, null);
    if (!isCouponApplicable(coupon, subtotal)) {
      throw new Error(`Coupon ${args.code} is not applicable to this cart`);
    }

    cart.couponCode = args.code;
    return this.toRawCart(cart);
  }

  async placeFoodOrder(args: PlaceOrderArgs): Promise<RawSwiggyOrder> {
    const cart = this.getOrCreateCart();
    const totals = this.toRawCart(cart);
    const order: RawSwiggyOrder = {
      orderId: `mock-order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      restaurantId: args.restaurantId,
      totalRupees: totals.total,
      placedAt: Date.now(),
    };

    const orders = mockOrdersByToken.get(this.bearerToken) ?? [];
    orders.push(order);
    mockOrdersByToken.set(this.bearerToken, orders);

    return order;
  }

  async trackFoodOrder(args: TrackOrderArgs): Promise<RawSwiggyTrackOrderResponse> {
    const order = (mockOrdersByToken.get(this.bearerToken) ?? []).find((o) => o.orderId === args.orderId);
    if (!order) throw new Error(`Unknown order id: ${args.orderId}`);

    const status = statusForElapsed(Date.now() - order.placedAt);
    return { orderId: order.orderId, status, etaMinutes: etaMinutesForStatus(status) };
  }

  async getFoodOrders(args: GetFoodOrdersArgs): Promise<RawSwiggyOrdersResponse> {
    const orders = (mockOrdersByToken.get(this.bearerToken) ?? []).filter(
      (order) => order.placedAt >= args.sinceTimestamp,
    );
    return { orders };
  }

  private getOrCreateCart(): MockCartState {
    let cart = mockCartsByToken.get(this.bearerToken);
    if (!cart) {
      cart = { restaurantId: null, items: [], couponCode: null };
      mockCartsByToken.set(this.bearerToken, cart);
    }
    return cart;
  }

  private toRawCart(cart: MockCartState): RawSwiggyCart {
    const coupon = cart.couponCode ? (MOCK_COUPONS.find((c) => c.code === cart.couponCode) ?? null) : null;
    const totals = computeCartTotals(cart.items, coupon);
    return {
      restaurantId: cart.restaurantId,
      items: cart.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      couponCode: cart.couponCode,
    };
  }
}

// Time-based simulation, no timers/background jobs — recomputed fresh on every
// poll from Date.now() - placedAt, so OrderStatusTracker.tsx visibly progresses
// through real statuses just by waiting between its polls.
function statusForElapsed(elapsedMs: number): string {
  const match = ORDER_STATUS_THRESHOLDS_MS.find((threshold) => elapsedMs < threshold.maxElapsedMs);
  return match ? match.status : "delivered";
}

function etaMinutesForStatus(status: string): number | null {
  return status === "delivered" ? null : 20;
}
