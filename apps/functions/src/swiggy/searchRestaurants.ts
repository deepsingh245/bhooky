import type { ParsedIntent } from "@bhooky/shared";
import type { RawSwiggySearchResponse, SwiggyMcpPort } from "./types.js";

export async function searchRestaurants(
  port: SwiggyMcpPort,
  addressId: string,
  intent: ParsedIntent,
): Promise<RawSwiggySearchResponse> {
  return port.searchRestaurants({
    addressId,
    query: buildQueryString(intent),
    vegOnly: intent.food_type === "veg",
    availabilityStatus: "OPEN",
  });
}

function buildQueryString(intent: ParsedIntent): string {
  const parts = [
    intent.taste,
    intent.food_type !== "any" ? intent.food_type : null,
    intent.time !== "any" ? intent.time : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" ") : intent.raw_query;
}
