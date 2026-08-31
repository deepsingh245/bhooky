import { describe, expect, it } from "vitest";
import type { RawSwiggyMenuItem, RawSwiggyRestaurant } from "../swiggy/types.js";
import { normalizeMenuItem, normalizeRestaurant } from "./normalize.js";

describe("normalizeRestaurant", () => {
  it("maps raw Swiggy restaurant fields to the normalized shape", () => {
    const raw: RawSwiggyRestaurant = {
      id: "r1",
      name: "Spice Villa",
      cuisines: ["North Indian"],
      avgRating: 4.3,
      costForTwo: 400,
      sla: { deliveryTimeMinutes: 30, distanceKm: 1.2 },
      availabilityStatus: "OPEN",
    };

    expect(normalizeRestaurant(raw)).toEqual({
      id: "r1",
      name: "Spice Villa",
      rating: 4.3,
      priceRange: { min: 120, max: 280 },
      distanceKm: 1.2,
      deliveryTimeMinutes: 30,
      isOpen: true,
      cuisines: ["North Indian"],
    });
  });

  it("marks CLOSED restaurants as not open", () => {
    const raw: RawSwiggyRestaurant = {
      id: "r5",
      name: "Sundown Cafe",
      cuisines: ["Continental"],
      avgRating: 3.9,
      costForTwo: 500,
      sla: { deliveryTimeMinutes: 45, distanceKm: 6 },
      availabilityStatus: "CLOSED",
    };

    expect(normalizeRestaurant(raw).isOpen).toBe(false);
  });
});

describe("normalizeMenuItem", () => {
  it("maps raw Swiggy menu item fields to the normalized shape", () => {
    const raw: RawSwiggyMenuItem = {
      id: "m1",
      name: "Paneer Tikka",
      price: 220,
      isVeg: true,
      tags: ["spicy", "starter"],
      inStock: true,
    };

    expect(normalizeMenuItem(raw, "r1")).toEqual({
      id: "m1",
      restaurantId: "r1",
      name: "Paneer Tikka",
      price: 220,
      veg: true,
      tags: ["spicy", "starter"],
      available: true,
    });
  });
});
