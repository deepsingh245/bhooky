import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { mirrorCart } from "../cart/mirrorCart.js";
import { normalizeCart } from "../cart/normalizeCart.js";
import { getSwiggyMcpClient } from "../swiggy/mcpClient.js";
import { getValidSwiggySession } from "../swiggy/session.js";
import { parseRequest, requireUid, withSwiggyReconnect } from "./handlerUtils.js";

const ApplyCouponRequestSchema = z.object({
  restaurantId: z.string().min(1),
  addressId: z.string().min(1),
  code: z.string().min(1),
});

export const applyCouponHandler = onCall(async (request) => {
  const uid = requireUid(request);
  const args = parseRequest(
    ApplyCouponRequestSchema,
    request.data,
    "restaurantId, addressId, and code are required.",
  );

  return withSwiggyReconnect(async () => {
    const { token } = await getValidSwiggySession(uid);
    const client = getSwiggyMcpClient(token);
    const rawCart = await client.applyFoodCoupon(args);
    const cart = normalizeCart(rawCart);
    void mirrorCart(uid, cart);
    return cart;
  });
});
