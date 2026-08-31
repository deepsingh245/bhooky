import { describe, expect, it } from "vitest";
import { parseIntentMock } from "./parseIntentMock.js";

describe("parseIntentMock", () => {
  it("parses food_type, taste, budget, and time from keywords", () => {
    const result = parseIntentMock("something spicy vegetarian under 300 for late night");

    expect(result).toEqual({
      food_type: "veg",
      taste: "spicy",
      budget: 300,
      time: "late_night",
      raw_query: "something spicy vegetarian under 300 for late night",
    });
  });

  it("detects non_veg keywords", () => {
    const result = parseIntentMock("chicken biryani for dinner");

    expect(result.food_type).toBe("non_veg");
    expect(result.time).toBe("dinner");
  });

  it("parses a bare rupee amount without 'under'", () => {
    const result = parseIntentMock("healthy bowl ₹250");

    expect(result.budget).toBe(250);
    expect(result.taste).toBe("healthy");
  });

  it("falls back to the permissive intent when nothing matches", () => {
    const result = parseIntentMock("surprise me");

    expect(result).toEqual({
      food_type: "any",
      taste: null,
      budget: null,
      time: "any",
      raw_query: "surprise me",
    });
  });
});
