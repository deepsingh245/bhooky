import type { SearchResponse } from "@bhooky/shared";
import { parseIntent } from "../gemini/parseIntent.js";
import { logQuery } from "../logging/logQuery.js";
import { rankResults } from "../ranking/rankResults.js";
import { getMenuForCandidates } from "../swiggy/getMenu.js";
import { getSwiggyMcpClient } from "../swiggy/mcpClient.js";
import { searchRestaurants } from "../swiggy/searchRestaurants.js";
import { getValidSwiggySession } from "../swiggy/session.js";
import { normalizeMenuItem, normalizeRestaurant } from "./normalize.js";

const MAX_MENU_FETCH_CANDIDATES = 8;
const LOGGED_TOP_RESULT_COUNT = 5;

export async function searchFood(userId: string, addressId: string, rawQuery: string): Promise<SearchResponse> {
  const { token } = await getValidSwiggySession(userId);
  const intent = await parseIntent(rawQuery);
  const client = getSwiggyMcpClient(token);

  const searchResponse = await searchRestaurants(client, addressId, intent);
  const candidateRestaurants = searchResponse.restaurants.slice(0, MAX_MENU_FETCH_CANDIDATES);

  const menuResponses = await getMenuForCandidates(
    client,
    candidateRestaurants.map((restaurant) => restaurant.id),
  );

  const normalizedRestaurants = candidateRestaurants.map(normalizeRestaurant);
  const normalizedItems = menuResponses.flatMap((menu) =>
    menu.items.map((item) => normalizeMenuItem(item, menu.restaurantId)),
  );

  const rankedCards = rankResults(normalizedItems, normalizedRestaurants, intent);

  void logQuery(
    userId,
    rawQuery,
    intent,
    rankedCards.slice(0, LOGGED_TOP_RESULT_COUNT).map((card) => card.menuItem.id),
  );

  return { intent, results: rankedCards };
}
