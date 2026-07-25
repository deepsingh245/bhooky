export interface SearchRestaurantsArgs {
  addressId: string;
  query: string;
  vegOnly: boolean;
  availabilityStatus: "OPEN";
}

export interface GetMenuArgs {
  restaurantId: string;
}

/**
 * Swiggy's actual Food MCP response schema isn't reproduced in our own docs —
 * these Raw* shapes are a best-guess placeholder modeled on typical food-delivery
 * API fields, deliberately kept small. MockSwiggyMcpClient produces exactly this
 * shape so normalize.ts/rankResults.ts can be built and tested without live
 * credentials. Reconcile these field names against Swiggy's real MCP tool output
 * the first time SWIGGY_MCP_MODE=live is exercised against staging (see liveClient.ts).
 */
export interface RawSwiggyRestaurant {
  id: string;
  name: string;
  cuisines: string[];
  avgRating: number;
  costForTwo: number;
  sla: { deliveryTimeMinutes: number; distanceKm: number };
  availabilityStatus: "OPEN" | "CLOSED";
}

export interface RawSwiggySearchResponse {
  restaurants: RawSwiggyRestaurant[];
}

export interface RawSwiggyMenuItem {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  tags: string[];
  inStock: boolean;
}

export interface RawSwiggyMenuResponse {
  restaurantId: string;
  items: RawSwiggyMenuItem[];
}

export interface SwiggyMcpPort {
  searchRestaurants(args: SearchRestaurantsArgs): Promise<RawSwiggySearchResponse>;
  getRestaurantMenu(args: GetMenuArgs): Promise<RawSwiggyMenuResponse>;
}
