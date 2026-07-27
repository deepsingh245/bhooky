import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { searchFood } from "../search/searchFood.js";
import { parseRequest, requireUid, withSwiggyReconnect } from "./handlerUtils.js";

const SearchRequestSchema = z.object({
  rawQuery: z.string().min(1),
  addressId: z.string().min(1),
});

export const searchHandler = onCall(async (request) => {
  const uid = requireUid(request);
  const { rawQuery, addressId } = parseRequest(SearchRequestSchema, request.data, "rawQuery and addressId are required.");

  return withSwiggyReconnect(() => searchFood(uid, addressId, rawQuery));
});
