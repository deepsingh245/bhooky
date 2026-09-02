import type { Address, Cart, Coupon, Order, ScoreBreakdown, SearchResponse, TrackOrderResponse } from "@bhooky/shared";
import { httpsCallable } from "firebase/functions";
import { authReady, functions } from "./firebase.js";

const SWIGGY_RECONNECT_REASON = "SWIGGY_RECONNECT_REQUIRED";

export class SwiggyReconnectRequiredError extends Error {
  constructor() {
    super("Swiggy session is missing or expired.");
    this.name = "SwiggyReconnectRequiredError";
  }
}

async function callWithReconnectHandling<T>(fn: () => Promise<T>): Promise<T> {
  await authReady;
  try {
    return await fn();
  } catch (error) {
    if (isReconnectRequiredError(error)) {
      throw new SwiggyReconnectRequiredError();
    }
    throw error;
  }
}

function isReconnectRequiredError(error: unknown): boolean {
  const details = (error as { details?: { reason?: unknown } }).details;
  return details?.reason === SWIGGY_RECONNECT_REASON;
}

interface SearchRequest {
  rawQuery: string;
  addressId: string;
}

interface SessionStatusResponse {
  connected: boolean;
  expiresAt: number | null;
}

interface AddressesResponse {
  addresses: Address[];
}

interface UpdateCartRequest {
  restaurantId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  addressId: string;
  // Only present when adding an item straight from a rendered search result.
  rank?: number;
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
}

interface FetchCouponsRequest {
  restaurantId: string;
  addressId: string;
}

interface ApplyCouponRequest {
  restaurantId: string;
  addressId: string;
  code: string;
}

interface CouponsResponse {
  coupons: Coupon[];
}

interface PlaceOrderRequest {
  restaurantId: string;
  addressId: string;
}

interface OauthStartResponse {
  authorizeUrl: string | null;
}

const searchFoodCallable = httpsCallable<SearchRequest, SearchResponse>(functions, "bhookySearchHandler");
const sessionStatusCallable = httpsCallable<Record<string, never>, SessionStatusResponse>(
  functions,
  "bhookySessionStatusHandler",
);
const getAddressesCallable = httpsCallable<Record<string, never>, AddressesResponse>(
  functions,
  "bhookyGetAddressesHandler",
);
const getCartCallable = httpsCallable<{ addressId: string }, Cart>(functions, "bhookyGetCartHandler");
const updateCartCallable = httpsCallable<UpdateCartRequest, Cart>(functions, "bhookyUpdateCartHandler");
const getCouponsCallable = httpsCallable<FetchCouponsRequest, CouponsResponse>(functions, "bhookyGetCouponsHandler");
const applyCouponCallable = httpsCallable<ApplyCouponRequest, Cart>(functions, "bhookyApplyCouponHandler");
const placeOrderCallable = httpsCallable<PlaceOrderRequest, Order>(functions, "bhookyOrderHandler");
const trackOrderCallable = httpsCallable<{ orderId: string }, TrackOrderResponse>(
  functions,
  "bhookyTrackOrderHandler",
);
const oauthStartCallable = httpsCallable<Record<string, never>, OauthStartResponse>(
  functions,
  "bhookyOauthStartHandler",
);

export function callSearchFood(rawQuery: string, addressId: string): Promise<SearchResponse> {
  return callWithReconnectHandling(async () => (await searchFoodCallable({ rawQuery, addressId })).data);
}

export function callSessionStatus(): Promise<SessionStatusResponse> {
  return callWithReconnectHandling(async () => (await sessionStatusCallable({})).data);
}

export function callGetAddresses(): Promise<Address[]> {
  return callWithReconnectHandling(async () => (await getAddressesCallable({})).data.addresses);
}

export function callGetCart(addressId: string): Promise<Cart> {
  return callWithReconnectHandling(async () => (await getCartCallable({ addressId })).data);
}

export function callUpdateCart(args: UpdateCartRequest): Promise<Cart> {
  return callWithReconnectHandling(async () => (await updateCartCallable(args)).data);
}

export function callFetchCoupons(restaurantId: string, addressId: string): Promise<Coupon[]> {
  return callWithReconnectHandling(async () => (await getCouponsCallable({ restaurantId, addressId })).data.coupons);
}

export function callApplyCoupon(args: ApplyCouponRequest): Promise<Cart> {
  return callWithReconnectHandling(async () => (await applyCouponCallable(args)).data);
}

export function callPlaceOrder(args: PlaceOrderRequest): Promise<Order> {
  return callWithReconnectHandling(async () => (await placeOrderCallable(args)).data);
}

export function callTrackOrder(orderId: string): Promise<TrackOrderResponse> {
  return callWithReconnectHandling(async () => (await trackOrderCallable({ orderId })).data);
}

export function callOauthStart(): Promise<string | null> {
  return callWithReconnectHandling(async () => (await oauthStartCallable({})).data.authorizeUrl);
}
