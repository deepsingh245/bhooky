import type { TimeOfDay } from "@bhooky/shared";

// Keyword tables for gemini/parseIntentMock.ts. Deliberately skip ambiguous
// words like "biryani" (exists as both veg and non-veg items in
// restaurants.ts) as a food_type signal.
export const VEG_KEYWORDS = ["veg", "vegetarian", "vegan"];
export const NON_VEG_KEYWORDS = ["non-veg", "non veg", "nonveg", "chicken", "mutton", "meat", "egg"];

// Aligned with tags actually used on menu items in restaurants.ts, so a
// matched taste keyword visibly changes ranking, not just parsing.
export const TASTE_KEYWORDS = ["spicy", "mild", "healthy", "cheesy"];

export const TIME_KEYWORD_MAP: Record<string, TimeOfDay> = {
  "late night": "late_night",
  late_night: "late_night",
  latenight: "late_night",
  lunch: "lunch",
  dinner: "dinner",
};
