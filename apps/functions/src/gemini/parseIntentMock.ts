import { PERMISSIVE_FALLBACK_INTENT, type ParsedIntent } from "@bhooky/shared";
import { NON_VEG_KEYWORDS, TASTE_KEYWORDS, TIME_KEYWORD_MAP, VEG_KEYWORDS } from "../dummy-data/index.js";

const BUDGET_PATTERN = /(?:under|below|less than)\s*(?:rs\.?|inr|₹)?\s*(\d+)|₹\s*(\d+)/i;

// Zero-network, zero-API-key stand-in for parseIntent.ts's real Gemini call —
// keyword-scans the query against dummy-data/intents.ts's tables. Used whenever
// GEMINI_MODE !== "live" (see parseIntent.ts).
export function parseIntentMock(rawQuery: string): ParsedIntent {
  const lowerQuery = rawQuery.toLowerCase();

  const foodType = VEG_KEYWORDS.some((keyword) => lowerQuery.includes(keyword))
    ? "veg"
    : NON_VEG_KEYWORDS.some((keyword) => lowerQuery.includes(keyword))
      ? "non_veg"
      : PERMISSIVE_FALLBACK_INTENT.food_type;

  const taste = TASTE_KEYWORDS.find((keyword) => lowerQuery.includes(keyword)) ?? PERMISSIVE_FALLBACK_INTENT.taste;

  const timeKeyword = Object.keys(TIME_KEYWORD_MAP).find((keyword) => lowerQuery.includes(keyword));
  const time = timeKeyword ? TIME_KEYWORD_MAP[timeKeyword]! : PERMISSIVE_FALLBACK_INTENT.time;

  const budgetMatch = BUDGET_PATTERN.exec(lowerQuery);
  const budget = budgetMatch ? Number(budgetMatch[1] ?? budgetMatch[2]) : PERMISSIVE_FALLBACK_INTENT.budget;

  return { food_type: foodType, taste, budget, time, raw_query: rawQuery };
}
