import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { normalizeCart } from "../cart/normalizeCart.js";
import { getSwiggyMcpClient } from "../swiggy/mcpClient.js";
import { getValidSwiggySession } from "../swiggy/session.js";
import { parseRequest, requireUid, withSwiggyReconnect } from "./handlerUtils.js";

const GetCartRequestSchema = z.object({
  addressId: z.string().min(1),
});

export const getCartHandler = onCall(async (request) => {
  const uid = requireUid(request);
  const { addressId } = parseRequest(GetCartRequestSchema, request.data, "addressId is required.");

  return withSwiggyReconnect(async () => {
    const { token } = await getValidSwiggySession(uid);
    const client = getSwiggyMcpClient(token);
    const rawCart = await client.getFoodCart({ addressId });
    return normalizeCart(rawCart);
  });
});
