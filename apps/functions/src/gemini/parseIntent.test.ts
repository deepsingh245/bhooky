import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const { generateContentMock } = vi.hoisted(() => ({ generateContentMock: vi.fn() }));

// parseIntent.ts defaults to GEMINI_MODE=mock (zero-API-key demo path, see
// parseIntentMock.ts) — these tests specifically exercise the real Gemini path.
beforeAll(() => {
  process.env.GEMINI_MODE = "live";
});

vi.mock("@google/genai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@google/genai")>();
  return {
    ...actual,
    GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAI() {
      return { models: { generateContent: generateContentMock } };
    }),
  };
});

import { parseIntent } from "./parseIntent.js";

afterEach(() => {
  generateContentMock.mockReset();
});

describe("parseIntent", () => {
  it("returns a schema-valid parsed intent with raw_query attached", async () => {
    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify({ food_type: "veg", taste: "spicy", budget: 300, time: "dinner" }),
    });

    const result = await parseIntent("spicy veg dinner under 300");

    expect(result).toEqual({
      food_type: "veg",
      taste: "spicy",
      budget: 300,
      time: "dinner",
      raw_query: "spicy veg dinner under 300",
    });
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it("retries once with a stricter instruction after a malformed first response", async () => {
    generateContentMock
      .mockResolvedValueOnce({ text: "not json" })
      .mockResolvedValueOnce({
        text: JSON.stringify({ food_type: "non_veg", taste: null, budget: null, time: "any" }),
      });

    const result = await parseIntent("something good");

    expect(generateContentMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      food_type: "non_veg",
      taste: null,
      budget: null,
      time: "any",
      raw_query: "something good",
    });
  });

  it("falls back to the permissive default when both attempts are malformed", async () => {
    generateContentMock.mockResolvedValue({ text: "still not json" });

    const result = await parseIntent("garbled query");

    expect(generateContentMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      food_type: "any",
      taste: null,
      budget: null,
      time: "any",
      raw_query: "garbled query",
    });
  });

  it("falls back to the permissive default when the API call throws", async () => {
    generateContentMock.mockRejectedValue(new Error("network error"));

    const result = await parseIntent("garbled query");

    expect(result.food_type).toBe("any");
  });
});
