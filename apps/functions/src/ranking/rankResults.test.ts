import type { NormalizedMenuItem, NormalizedRestaurant, ParsedIntent } from "@bhooky/shared";
import { describe, expect, it } from "vitest";
import type { RawSwiggyCoupon } from "../swiggy/types.js";
import { rankResults } from "./rankResults.js";

const restaurants: NormalizedRestaurant[] = [
  {
    id: "r1",
    name: "Spice Villa",
    rating: 4.3,
    priceRange: { min: 100, max: 300 },
    distanceKm: 1.2,
    deliveryTimeMinutes: 35,
    isOpen: true,
    cuisines: ["North Indian"],
  },
  {
    id: "r2",
    name: "Green Bowl",
    rating: 4.6,
    priceRange: { min: 60, max: 150 },
    distanceKm: 2.5,
    deliveryTimeMinutes: 30,
    isOpen: true,
    cuisines: ["Healthy"],
  },
  {
    id: "r5",
    name: "Sundown Cafe",
    rating: 3.9,
    priceRange: { min: 150, max: 350 },
    distanceKm: 6,
    deliveryTimeMinutes: 50,
    isOpen: false,
    cuisines: ["Continental"],
  },
];

const items: NormalizedMenuItem[] = [
  { id: "m1", restaurantId: "r1", name: "Chicken Biryani", price: 280, veg: false, tags: ["spicy"], available: true },
  {
    id: "m2",
    restaurantId: "r2",
    name: "Veg Buddha Bowl",
    price: 220,
    veg: true,
    tags: ["healthy", "mild"],
    available: true,
  },
  { id: "m3", restaurantId: "r5", name: "Grilled Sandwich", price: 200, veg: true, tags: ["mild"], available: true },
];

const baseIntent: ParsedIntent = { food_type: "any", taste: null, budget: null, time: "any", raw_query: "test" };

describe("rankResults", () => {
  it("excludes items from closed restaurants", () => {
    const ranked = rankResults(items, restaurants, baseIntent);
    expect(ranked.some((card) => card.restaurant.id === "r5")).toBe(false);
  });

  it("ranks a veg-intent match above a non-matching item at similar price/rating", () => {
    const intent: ParsedIntent = { ...baseIntent, food_type: "veg" };
    const ranked = rankResults(items, restaurants, intent);
    expect(ranked[0]?.menuItem.id).toBe("m2");
  });

  it("penalizes items priced over the stated budget", () => {
    const intent: ParsedIntent = { ...baseIntent, budget: 150 };
    const ranked = rankResults(items, restaurants, intent);
    const chicken = ranked.find((card) => card.menuItem.id === "m1");
    expect(chicken?.scoreBreakdown.budgetMatch).toBeLessThan(1);
  });

  it("returns an empty array when there are no items", () => {
    expect(rankResults([], restaurants, baseIntent)).toEqual([]);
  });

  it("ranks a restaurant with a strong coupon above an otherwise-identical one without", () => {
    const identicalItems: NormalizedMenuItem[] = [
      { id: "m1", restaurantId: "r1", name: "Dal Makhani", price: 200, veg: true, tags: [], available: true },
      { id: "m2", restaurantId: "r2", name: "Veg Buddha Bowl", price: 200, veg: true, tags: [], available: true },
    ];
    const identicalRestaurants: NormalizedRestaurant[] = [
      { ...restaurants[0]!, priceRange: { min: 200, max: 200 } },
      { ...restaurants[1]!, id: "r2", rating: restaurants[0]!.rating, distanceKm: restaurants[0]!.distanceKm },
    ];
    const offerScoresByRestaurantId = new Map([
      ["r1", 0],
      ["r2", 1],
    ]);
    const winningCoupon: RawSwiggyCoupon = {
      code: "FLAT50",
      description: "Flat ₹50 off",
      discountAmount: 50,
      minOrderValueRupees: null,
    };
    const bestOfferByRestaurantId = new Map<string, RawSwiggyCoupon | null>([
      ["r1", null],
      ["r2", winningCoupon],
    ]);

    const ranked = rankResults(
      identicalItems,
      identicalRestaurants,
      baseIntent,
      offerScoresByRestaurantId,
      bestOfferByRestaurantId,
    );

    expect(ranked[0]?.restaurant.id).toBe("r2");
    expect(ranked[0]?.bestOffer).toEqual({ code: "FLAT50", discountAmount: 50 });
    expect(ranked.find((card) => card.restaurant.id === "r1")?.bestOffer).toBeNull();
  });
});
