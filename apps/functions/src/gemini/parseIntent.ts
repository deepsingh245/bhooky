import {
  ParsedIntentFieldsSchema,
  PERMISSIVE_FALLBACK_INTENT,
  type ParsedIntent,
  type ParsedIntentFields,
} from "@bhooky/shared";
import { Type } from "@google/genai";
import { getGeminiClient } from "./geminiClient.js";
import { parseIntentMock } from "./parseIntentMock.js";

// Mirrors packages/shared/src/types/intent.ts's ParsedIntentFieldsSchema field-for-
// field so the two can't silently drift, even though they're necessarily expressed
// in two different schema formats (Gemini's constrained-decoding schema vs zod).
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    food_type: { type: Type.STRING, enum: ["veg", "non_veg", "any"] },
    taste: { type: Type.STRING, nullable: true },
    budget: { type: Type.NUMBER, nullable: true },
    time: { type: Type.STRING, enum: ["late_night", "lunch", "dinner", "any"] },
  },
  required: ["food_type", "taste", "budget", "time"],
  propertyOrdering: ["food_type", "taste", "budget", "time"],
};

const STRICT_JSON_INSTRUCTION = "Return ONLY JSON matching the schema. No prose, no markdown code fences.";

// GEMINI_MODE mirrors SWIGGY_MCP_MODE's mock|live selector: defaults to "mock"
// so a fresh clone works with zero Gemini API key, no network call, no latency.
export async function parseIntent(rawQuery: string): Promise<ParsedIntent> {
  if ((process.env.GEMINI_MODE ?? "mock") !== "live") {
    return parseIntentMock(rawQuery);
  }

  const fields =
    (await requestParsedFields(rawQuery)) ??
    (await requestParsedFields(rawQuery, STRICT_JSON_INSTRUCTION)) ??
    PERMISSIVE_FALLBACK_INTENT;

  return { ...fields, raw_query: rawQuery };
}

// A Gemini hiccup (malformed JSON, empty response, transient API error) must never
// fail the whole search — this returns null instead of throwing so parseIntent can
// retry once, then fall back to a permissive default.
async function requestParsedFields(rawQuery: string, extraInstruction?: string): Promise<ParsedIntentFields | null> {
  try {
    const response = await getGeminiClient().models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      contents: extraInstruction ? `${rawQuery}\n\n${extraInstruction}` : rawQuery,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    if (!response.text) return null;

    const parsed: unknown = JSON.parse(response.text);
    const result = ParsedIntentFieldsSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
