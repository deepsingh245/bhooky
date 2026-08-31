import type { Order } from "@bhooky/shared";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { isOverOrderCap } from "../cart/cartTotals.js";
import { normalizeCart } from "../cart/normalizeCart.js";
import { logRankingFeedback } from "../logging/logRankingFeedback.js";
import { placeOrderWithIdempotencyCheck } from "../orders/orderRetry.js";
import { getSwiggyMcpClient } from "../swiggy/mcpClient.js";
import { getValidSwiggySession, invalidateSwiggySession, isSwiggyUnauthorizedError } from "../swiggy/session.js";
import { parseRequest, requireUid, withSwiggyReconnect } from "./handlerUtils.js";

const PlaceOrderRequestSchema = z.object({
  restaurantId: z.string().min(1),
  addressId: z.string().min(1),
});

export const orderHandler = onCall(async (request) => {
  const uid = requireUid(request);
  const args = parseRequest(PlaceOrderRequestSchema, request.data, "restaurantId and addressId are required.");

  return withSwiggyReconnect(async () => {
    const { token } = await getValidSwiggySession(uid);
    const client = getSwiggyMcpClient(token);

    // Never trust the client-side cap check alone — re-validate server-side
    // against the cart Swiggy actually holds (BHOOKY_BUILD_PLAN.md §8).
    const cart = normalizeCart(await client.getFoodCart({ addressId: args.addressId }));
    if (isOverOrderCap(cart.total)) {
      throw new HttpsError("failed-precondition", `Order total ₹${cart.total} exceeds the ₹1000 cap.`);
    }

    try {
      const rawOrder = await placeOrderWithIdempotencyCheck(client, args);
      if (cart.restaurantId) {
        for (const item of cart.items) void logRankingFeedback(uid, item.menuItemId, cart.restaurantId, "ordered");
      }

      const order: Order = {
        id: rawOrder.orderId,
        status: "placed",
        restaurantId: rawOrder.restaurantId,
        cartSnapshot: cart,
        placedAt: rawOrder.placedAt,
      };
      return order;
    } catch (error) {
      if (isSwiggyUnauthorizedError(error)) await invalidateSwiggySession(uid);
      throw error;
    }
  });
});
