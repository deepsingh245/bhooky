import type { ParsedIntent } from "./intent.js";
import type { RankedCard } from "./ranking.js";

export interface SearchResponse {
  intent: ParsedIntent;
  results: RankedCard[];
}
