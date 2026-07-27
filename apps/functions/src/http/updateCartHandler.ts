import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { mirrorCart } from "../cart/mirrorCart.js";
import { normalizeCart } from "../cart/normalizeCart.js";
import { logRankingFeedback } from "../logging/logRankingFeedback.js";
import { getSwiggyMcpClient } from "../swiggy/mcpClient.js";
import { getValidSwiggySession } from "../swiggy/session.js";
import { parseRequest, requireUid, withSwiggyReconnect } from "./handlerUtils.js";

const UpdateCartRequestSchema = z.object({
  restaurantId: z.string().min(1),
  menuItemId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(0),
  addressId: z.string().min(1),
});

export const updateCartHandler = onCall(async (request) => {
  const uid = requireUid(request);
  const args = parseRequest(
    UpdateCartRequestSchema,
    request.data,
    "restaurantId, menuItemId, name, price, quantity, and addressId are required.",
  );

  return withSwiggyReconnect(async () => {
    const { token } = await getValidSwiggySession(uid);
    const client = getSwiggyMcpClient(token);
    const rawCart = await client.updateFoodCart(args);
    const cart = normalizeCart(rawCart);
    void mirrorCart(uid, cart);
    if (args.quantity > 0) void logRankingFeedback(uid, args.menuItemId, "added_to_cart");
    return cart;
  });
});
