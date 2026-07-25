import { MOCK_MENUS_BY_RESTAURANT_ID, MOCK_RESTAURANTS } from "./fixtures/mockData.js";
import type {
  GetMenuArgs,
  RawSwiggyMenuResponse,
  RawSwiggySearchResponse,
  SearchRestaurantsArgs,
  SwiggyMcpPort,
} from "./types.js";

// Ignores the bearer token and real query semantics entirely — the point of mock
// mode is to decouple "does search -> rank -> render work" from "is Swiggy OAuth/
// staging access set up yet." See the mock/live selection in mcpClient.ts.
export class MockSwiggyMcpClient implements SwiggyMcpPort {
  async searchRestaurants(_args: SearchRestaurantsArgs): Promise<RawSwiggySearchResponse> {
    return { restaurants: MOCK_RESTAURANTS };
  }

  async getRestaurantMenu(args: GetMenuArgs): Promise<RawSwiggyMenuResponse> {
    const items = MOCK_MENUS_BY_RESTAURANT_ID[args.restaurantId] ?? [];
    return { restaurantId: args.restaurantId, items };
  }
}
