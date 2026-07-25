import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { searchFood } from "../search/searchFood.js";
import { SwiggySessionExpiredError } from "../swiggy/session.js";

const SearchRequestSchema = z.object({
  rawQuery: z.string().min(1),
  addressId: z.string().min(1),
});

export const searchHandler = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign-in is required to search.");
  }

  const parsed = SearchRequestSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "rawQuery and addressId are required.");
  }

  try {
    return await searchFood(request.auth.uid, parsed.data.addressId, parsed.data.rawQuery);
  } catch (error) {
    if (error instanceof SwiggySessionExpiredError) {
      throw new HttpsError("failed-precondition", "Swiggy session is missing or expired.", {
        reason: "SWIGGY_RECONNECT_REQUIRED",
      });
    }
    throw error;
  }
});
