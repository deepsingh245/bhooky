import {
  MAX_RANKED_RESULTS,
  NEUTRAL_OFFER_SCORE,
  RANKING_WEIGHTS,
  type NormalizedMenuItem,
  type NormalizedRestaurant,
  type ParsedIntent,
  type RankedCard,
} from "@bhooky/shared";

const MAX_RELEVANT_DISTANCE_KM = 10;

// score = (budget_match * 0.3) + (distance * 0.2) + (rating * 0.2) + (offer * 0.2) + (intent_match * 0.1)
// See BHOOKY_BUILD_PLAN.md §5. Closed restaurants and out-of-stock items never rank.
// offerScoresByRestaurantId is coupon-derived (see ranking/offerScore.ts); it
// defaults to empty so callers/tests that don't care about offers fall back to
// the Phase 1 neutral placeholder score.
export function rankResults(
  items: NormalizedMenuItem[],
  restaurants: NormalizedRestaurant[],
  intent: ParsedIntent,
  offerScoresByRestaurantId: Map<string, number> = new Map(),
): RankedCard[] {
  const restaurantById = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));

  const cards: RankedCard[] = [];
  for (const menuItem of items) {
    const restaurant = restaurantById.get(menuItem.restaurantId);
    if (!restaurant || !restaurant.isOpen || !menuItem.available) continue;

    const scoreBreakdown = {
      budgetMatch: scoreBudgetMatch(menuItem.price, intent.budget),
      distance: scoreDistance(restaurant.distanceKm),
      rating: scoreRating(restaurant.rating),
      offer: offerScoresByRestaurantId.get(restaurant.id) ?? NEUTRAL_OFFER_SCORE,
      intentMatch: scoreIntentMatch(menuItem, intent),
    };

    const score =
      scoreBreakdown.budgetMatch * RANKING_WEIGHTS.budgetMatch +
      scoreBreakdown.distance * RANKING_WEIGHTS.distance +
      scoreBreakdown.rating * RANKING_WEIGHTS.rating +
      scoreBreakdown.offer * RANKING_WEIGHTS.offer +
      scoreBreakdown.intentMatch * RANKING_WEIGHTS.intentMatch;

    cards.push({ menuItem, restaurant, score, scoreBreakdown });
  }

  return cards.sort((a, b) => b.score - a.score).slice(0, MAX_RANKED_RESULTS);
}

function scoreBudgetMatch(price: number, budget: number | null): number {
  if (budget === null) return 1;
  if (price <= budget) return 1;
  const overBy = (price - budget) / budget;
  return Math.max(0, 1 - overBy);
}

function scoreDistance(distanceKm: number): number {
  return Math.max(0, 1 - distanceKm / MAX_RELEVANT_DISTANCE_KM);
}

function scoreRating(rating: number): number {
  return Math.max(0, Math.min(1, rating / 5));
}

function scoreIntentMatch(menuItem: NormalizedMenuItem, intent: ParsedIntent): number {
  let matches = 0;
  let checks = 0;

  if (intent.food_type !== "any") {
    checks++;
    const wantsVeg = intent.food_type === "veg";
    if (menuItem.veg === wantsVeg) matches++;
  }

  if (intent.taste) {
    checks++;
    const taste = intent.taste.toLowerCase();
    if (menuItem.tags.some((tag) => tag.toLowerCase().includes(taste))) matches++;
  }

  if (intent.time !== "any") {
    checks++;
    if (menuItem.tags.some((tag) => tag.toLowerCase() === intent.time)) matches++;
  }

  if (checks === 0) return 1;
  return matches / checks;
}
