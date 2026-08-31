import type { RawSwiggyMenuItem, RawSwiggyRestaurant } from "../swiggy/types.js";

/**
 * Five restaurants chosen so every ranking axis (budget/distance/rating/intent,
 * plus an open/closed filter) has something meaningful to sort during local dev
 * and the manual QA pass. See plans/phase-1-plan.md §6.
 */
export const MOCK_RESTAURANTS: RawSwiggyRestaurant[] = [
  {
    id: "r1",
    name: "Spice Villa",
    cuisines: ["North Indian", "Mughlai"],
    avgRating: 4.3,
    costForTwo: 500,
    sla: { deliveryTimeMinutes: 35, distanceKm: 1.2 },
    availabilityStatus: "OPEN",
  },
  {
    id: "r2",
    name: "Green Bowl",
    cuisines: ["Healthy", "Salads"],
    avgRating: 4.6,
    costForTwo: 300,
    sla: { deliveryTimeMinutes: 30, distanceKm: 2.5 },
    availabilityStatus: "OPEN",
  },
  {
    id: "r3",
    name: "Midnight Munchies",
    cuisines: ["Fast Food"],
    avgRating: 3.8,
    costForTwo: 250,
    sla: { deliveryTimeMinutes: 25, distanceKm: 4.0 },
    availabilityStatus: "OPEN",
  },
  {
    id: "r4",
    name: "Royal Biryani House",
    cuisines: ["Biryani", "Hyderabadi"],
    avgRating: 4.1,
    costForTwo: 700,
    sla: { deliveryTimeMinutes: 20, distanceKm: 0.8 },
    availabilityStatus: "OPEN",
  },
  {
    id: "r5",
    name: "Sundown Cafe",
    cuisines: ["Continental", "Cafe"],
    avgRating: 3.9,
    costForTwo: 450,
    sla: { deliveryTimeMinutes: 50, distanceKm: 6.0 },
    availabilityStatus: "CLOSED",
  },
];

export const MOCK_MENUS_BY_RESTAURANT_ID: Record<string, RawSwiggyMenuItem[]> = {
  r1: [
    { id: "r1-m1", name: "Dal Makhani", price: 180, isVeg: true, tags: ["mild", "curry"], inStock: true },
    { id: "r1-m2", name: "Paneer Tikka", price: 220, isVeg: true, tags: ["spicy", "starter"], inStock: true },
    { id: "r1-m3", name: "Chicken Seekh Kebab", price: 300, isVeg: false, tags: ["spicy", "starter"], inStock: true },
    { id: "r1-m4", name: "Butter Chicken", price: 420, isVeg: false, tags: ["spicy", "curry"], inStock: true },
    {
      id: "r1-m5",
      name: "Grilled Chicken Skewers",
      price: 320,
      isVeg: false,
      tags: ["spicy", "grill"],
      inStock: false,
    },
  ],
  r2: [
    { id: "r2-m1", name: "Sprout Salad", price: 99, isVeg: true, tags: ["healthy", "mild", "salad"], inStock: true },
    { id: "r2-m2", name: "Quinoa Khichdi", price: 180, isVeg: true, tags: ["healthy", "mild"], inStock: true },
    { id: "r2-m3", name: "Veg Buddha Bowl", price: 250, isVeg: true, tags: ["healthy", "mild", "bowl"], inStock: true },
  ],
  r3: [
    { id: "r3-m1", name: "Midnight Maggi", price: 80, isVeg: true, tags: ["late_night", "mild"], inStock: true },
    {
      id: "r3-m2",
      name: "Loaded Cheese Fries",
      price: 99,
      isVeg: true,
      tags: ["late_night", "cheesy"],
      inStock: true,
    },
    {
      id: "r3-m3",
      name: "Chicken Wings",
      price: 150,
      isVeg: false,
      tags: ["spicy", "late_night", "fried"],
      inStock: true,
    },
  ],
  r4: [
    { id: "r4-m1", name: "Veg Biryani", price: 250, isVeg: true, tags: ["mild", "biryani"], inStock: true },
    { id: "r4-m2", name: "Chicken Biryani", price: 320, isVeg: false, tags: ["spicy", "biryani"], inStock: true },
    { id: "r4-m3", name: "Mutton Biryani", price: 450, isVeg: false, tags: ["spicy", "biryani"], inStock: true },
  ],
  r5: [
    { id: "r5-m1", name: "Grilled Sandwich", price: 200, isVeg: true, tags: ["mild"], inStock: true },
    { id: "r5-m2", name: "Club Sandwich", price: 250, isVeg: false, tags: ["mild"], inStock: true },
  ],
};
