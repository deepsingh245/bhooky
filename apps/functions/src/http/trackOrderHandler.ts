import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { getSwiggyMcpClient } from "../swiggy/mcpClient.js";
import { getValidSwiggySession } from "../swiggy/session.js";
import { parseRequest, requireUid, withSwiggyReconnect } from "./handlerUtils.js";

const TrackOrderRequestSchema = z.object({
  orderId: z.string().min(1),
});

// Thin pass-through — TRACK_ORDER_MIN_POLL_INTERVAL_MS is Swiggy's own rate
// limit, enforced client-side in OrderStatusTracker.tsx's poll loop rather
// than re-policed here.
export const trackOrderHandler = onCall(async (request) => {
  const uid = requireUid(request);
  const { orderId } = parseRequest(TrackOrderRequestSchema, request.data, "orderId is required.");

  return withSwiggyReconnect(async () => {
    const { token } = await getValidSwiggySession(uid);
    const client = getSwiggyMcpClient(token);
    return client.trackFoodOrder({ orderId });
  });
});
