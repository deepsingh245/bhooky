// score = (budget_match * 0.3) + (distance * 0.2) + (rating * 0.2) + (offer * 0.2) + (intent_match * 0.1)
// See BHOOKY_BUILD_PLAN.md §5.
export const RANKING_WEIGHTS = {
  budgetMatch: 0.3,
  distance: 0.2,
  rating: 0.2,
  offer: 0.2,
  intentMatch: 0.1,
} as const;

// Phase 1 has no live coupon data (fetch_food_coupons lands in Phase 2), so every
// item gets this neutral offer sub-score instead of skewing rankings toward zero.
export const NEUTRAL_OFFER_SCORE = 0.5;

export const MAX_RANKED_RESULTS = 20;
