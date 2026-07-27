export interface SearchRestaurantsArgs {
  addressId: string;
  query: string;
  vegOnly: boolean;
  availabilityStatus: "OPEN";
}

export interface GetMenuArgs {
  restaurantId: string;
}

/**
 * Swiggy's actual Food MCP response schema isn't reproduced in our own docs —
 * these Raw* shapes are a best-guess placeholder modeled on typical food-delivery
 * API fields, deliberately kept small. MockSwiggyMcpClient produces exactly this
 * shape so normalize.ts/rankResults.ts can be built and tested without live
 * credentials. Reconcile these field names against Swiggy's real MCP tool output
 * the first time SWIGGY_MCP_MODE=live is exercised against staging (see liveClient.ts).
 */
export interface RawSwiggyRestaurant {
  id: string;
  name: string;
  cuisines: string[];
  avgRating: number;
  costForTwo: number;
  sla: { deliveryTimeMinutes: number; distanceKm: number };
  availabilityStatus: "OPEN" | "CLOSED";
}

export interface RawSwiggySearchResponse {
  restaurants: RawSwiggyRestaurant[];
}

export interface RawSwiggyMenuItem {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  tags: string[];
  inStock: boolean;
}

export interface RawSwiggyMenuResponse {
  restaurantId: string;
  items: RawSwiggyMenuItem[];
}

export interface RawSwiggyAddress {
  id: string;
  annotation: string;
  addressLine1: string;
  addressLine2: string;
  isDefault: boolean;
}

export interface RawSwiggyAddressesResponse {
  addresses: RawSwiggyAddress[];
}

export interface RawSwiggyCartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface RawSwiggyCart {
  restaurantId: string | null;
  items: RawSwiggyCartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode: string | null;
}

export interface GetCartArgs {
  addressId: string;
}

export interface UpdateCartArgs {
  restaurantId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  addressId: string;
}

export interface RawSwiggyCoupon {
  code: string;
  description: string;
  discountAmount: number;
  minOrderValueRupees: number | null;
}

export interface FetchCouponsArgs {
  restaurantId: string;
  addressId: string;
}

export interface RawSwiggyCouponsResponse {
  coupons: RawSwiggyCoupon[];
}

export interface ApplyCouponArgs {
  restaurantId: string;
  addressId: string;
  code: string;
}

export interface PlaceOrderArgs {
  restaurantId: string;
  addressId: string;
}

export interface RawSwiggyOrder {
  orderId: string;
  restaurantId: string;
  totalRupees: number;
  placedAt: number;
}

export interface TrackOrderArgs {
  orderId: string;
}

export interface RawSwiggyTrackOrderResponse {
  orderId: string;
  status: string;
  etaMinutes: number | null;
}

export interface GetFoodOrdersArgs {
  sinceTimestamp: number;
}

export interface RawSwiggyOrdersResponse {
  orders: RawSwiggyOrder[];
}

export interface SwiggyMcpPort {
  searchRestaurants(args: SearchRestaurantsArgs): Promise<RawSwiggySearchResponse>;
  getRestaurantMenu(args: GetMenuArgs): Promise<RawSwiggyMenuResponse>;
  getAddresses(): Promise<RawSwiggyAddressesResponse>;
  getFoodCart(args: GetCartArgs): Promise<RawSwiggyCart>;
  updateFoodCart(args: UpdateCartArgs): Promise<RawSwiggyCart>;
  fetchFoodCoupons(args: FetchCouponsArgs): Promise<RawSwiggyCouponsResponse>;
  applyFoodCoupon(args: ApplyCouponArgs): Promise<RawSwiggyCart>;
  placeFoodOrder(args: PlaceOrderArgs): Promise<RawSwiggyOrder>;
  trackFoodOrder(args: TrackOrderArgs): Promise<RawSwiggyTrackOrderResponse>;
  getFoodOrders(args: GetFoodOrdersArgs): Promise<RawSwiggyOrdersResponse>;
}
