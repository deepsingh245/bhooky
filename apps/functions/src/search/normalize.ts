import type { NormalizedMenuItem, NormalizedRestaurant } from "@bhooky/shared";
import type { RawSwiggyMenuItem, RawSwiggyRestaurant } from "../swiggy/types.js";

export function normalizeRestaurant(raw: RawSwiggyRestaurant): NormalizedRestaurant {
  return {
    id: raw.id,
    name: raw.name,
    rating: raw.avgRating,
    priceRange: estimatePriceRangeFromCostForTwo(raw.costForTwo),
    distanceKm: raw.sla.distanceKm,
    deliveryTimeMinutes: raw.sla.deliveryTimeMinutes,
    isOpen: raw.availabilityStatus === "OPEN",
    cuisines: raw.cuisines,
  };
}

export function normalizeMenuItem(raw: RawSwiggyMenuItem, restaurantId: string): NormalizedMenuItem {
  return {
    id: raw.id,
    restaurantId,
    name: raw.name,
    price: raw.price,
    veg: raw.isVeg,
    tags: raw.tags,
    available: raw.inStock,
  };
}

function estimatePriceRangeFromCostForTwo(costForTwo: number): { min: number; max: number } {
  const perPerson = costForTwo / 2;
  return { min: Math.round(perPerson * 0.6), max: Math.round(perPerson * 1.4) };
}
