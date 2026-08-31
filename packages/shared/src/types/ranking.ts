import type { NormalizedMenuItem, NormalizedRestaurant } from "./restaurant.js";

export interface ScoreBreakdown {
  budgetMatch: number;
  distance: number;
  rating: number;
  offer: number;
  intentMatch: number;
}

export interface RankedCard {
  menuItem: NormalizedMenuItem;
  restaurant: NormalizedRestaurant;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  bestOffer: { code: string; discountAmount: number } | null;
}
