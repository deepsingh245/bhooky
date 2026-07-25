import { z } from "zod";

export const FoodTypeSchema = z.enum(["veg", "non_veg", "any"]);
export type FoodType = z.infer<typeof FoodTypeSchema>;

export const TimeOfDaySchema = z.enum(["late_night", "lunch", "dinner", "any"]);
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>;

/**
 * Fields Gemini is responsible for producing. Kept separate from raw_query
 * because raw_query is attached by parseIntent.ts after validation, not by
 * the model itself.
 */
export const ParsedIntentFieldsSchema = z.object({
  food_type: FoodTypeSchema,
  taste: z.string().nullable(),
  budget: z.number().nullable(),
  time: TimeOfDaySchema,
});
export type ParsedIntentFields = z.infer<typeof ParsedIntentFieldsSchema>;

export interface ParsedIntent extends ParsedIntentFields {
  raw_query: string;
}

export const PERMISSIVE_FALLBACK_INTENT: ParsedIntentFields = {
  food_type: "any",
  taste: null,
  budget: null,
  time: "any",
};
