import type { Cart } from "./cart.js";

export type OrderStatus = "placed" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";

export interface Order {
  id: string;
  status: OrderStatus;
  restaurantId: string;
  cartSnapshot: Cart;
  placedAt: number;
}

export interface TrackOrderResponse {
  orderId: string;
  status: OrderStatus;
  etaMinutes: number | null;
}
