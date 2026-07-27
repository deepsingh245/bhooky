import type { PlaceOrderArgs, RawSwiggyOrder, SwiggyMcpPort } from "../swiggy/types.js";

const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 200;

// place_food_order is not idempotent (BHOOKY_BUILD_PLAN.md §8): on any failure,
// check get_food_orders before ever retrying, so a request that actually
// succeeded upstream never gets placed twice.
export async function placeOrderWithIdempotencyCheck(
  port: SwiggyMcpPort,
  args: PlaceOrderArgs,
): Promise<RawSwiggyOrder> {
  const attemptStartedAt = Date.now();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await port.placeFoodOrder(args);
    } catch (error) {
      const existingOrder = await findOrderSince(port, args.restaurantId, attemptStartedAt);
      if (existingOrder) return existingOrder;

      if (attempt === MAX_ATTEMPTS) throw error;
      await sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1));
    }
  }

  throw new Error("placeOrderWithIdempotencyCheck: unreachable");
}

async function findOrderSince(
  port: SwiggyMcpPort,
  restaurantId: string,
  sinceTimestamp: number,
): Promise<RawSwiggyOrder | null> {
  const { orders } = await port.getFoodOrders({ sinceTimestamp });
  return orders.find((order) => order.restaurantId === restaurantId) ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
