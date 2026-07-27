import type { RawSwiggyCoupon, SwiggyMcpPort } from "./types.js";

const MAX_CONCURRENT_COUPON_FETCHES = 3;

export interface RestaurantCoupons {
  restaurantId: string;
  coupons: RawSwiggyCoupon[];
}

// Same concurrency-capped fan-out shape as getMenu.ts's getMenuForCandidates.
export async function getCouponsForCandidates(
  port: SwiggyMcpPort,
  addressId: string,
  restaurantIds: string[],
): Promise<RestaurantCoupons[]> {
  const results: RestaurantCoupons[] = [];
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < restaurantIds.length) {
      const index = cursor++;
      const restaurantId = restaurantIds[index];
      if (restaurantId === undefined) continue;
      const response = await port.fetchFoodCoupons({ restaurantId, addressId });
      results[index] = { restaurantId, coupons: response.coupons };
    }
  }

  const workerCount = Math.min(MAX_CONCURRENT_COUPON_FETCHES, restaurantIds.length);
  await Promise.all(Array.from({ length: workerCount }, worker));

  return results;
}
