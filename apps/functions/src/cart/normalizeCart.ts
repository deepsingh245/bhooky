import type { Cart } from "@bhooky/shared";
import type { RawSwiggyCart } from "../swiggy/types.js";

export function normalizeCart(raw: RawSwiggyCart): Cart {
  return {
    restaurantId: raw.restaurantId,
    items: raw.items,
    subtotal: raw.subtotal,
    discount: raw.discount,
    deliveryFee: raw.deliveryFee,
    total: raw.total,
    couponCode: raw.couponCode,
  };
}
