import { getOrFetch } from "./restaurantCache.js";
import type { RawSwiggyMenuResponse, SwiggyMcpPort } from "./types.js";

const MAX_CONCURRENT_MENU_FETCHES = 3;

export async function getMenuForCandidates(
  port: SwiggyMcpPort,
  restaurantIds: string[],
): Promise<RawSwiggyMenuResponse[]> {
  const results: RawSwiggyMenuResponse[] = [];
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < restaurantIds.length) {
      const index = cursor++;
      const restaurantId = restaurantIds[index];
      if (restaurantId === undefined) continue;
      results[index] = await getOrFetch(`menu:${restaurantId}`, () => port.getRestaurantMenu({ restaurantId }));
    }
  }

  const workerCount = Math.min(MAX_CONCURRENT_MENU_FETCHES, restaurantIds.length);
  await Promise.all(Array.from({ length: workerCount }, worker));

  return results;
}
