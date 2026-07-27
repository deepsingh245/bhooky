import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { isCouponApplicable } from "../cart/cartTotals.js";
import { normalizeCoupon } from "../cart/normalizeCoupon.js";
import { getSwiggyMcpClient } from "../swiggy/mcpClient.js";
import { getValidSwiggySession } from "../swiggy/session.js";
import { parseRequest, requireUid, withSwiggyReconnect } from "./handlerUtils.js";

const GetCouponsRequestSchema = z.object({
  restaurantId: z.string().min(1),
  addressId: z.string().min(1),
});

export const getCouponsHandler = onCall(async (request) => {
  const uid = requireUid(request);
  const { restaurantId, addressId } = parseRequest(
    GetCouponsRequestSchema,
    request.data,
    "restaurantId and addressId are required.",
  );

  return withSwiggyReconnect(async () => {
    const { token } = await getValidSwiggySession(uid);
    const client = getSwiggyMcpClient(token);

    const [cart, couponsResponse] = await Promise.all([
      client.getFoodCart({ addressId }),
      client.fetchFoodCoupons({ restaurantId, addressId }),
    ]);

    const coupons = couponsResponse.coupons.map((coupon) =>
      normalizeCoupon(coupon, isCouponApplicable(coupon, cart.subtotal)),
    );
    return { coupons };
  });
});
