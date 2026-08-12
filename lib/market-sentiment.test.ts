import { describe, expect, it } from "vitest";
import { parseFearGreedResponse } from "./market-sentiment";

const entry = { value: "31", value_classification: "Fear", timestamp: "172345", time_until_update: "3600" };

describe("Fear & Greed provider response", () => {
  it("normalizes a valid provider response", () => {
    expect(parseFearGreedResponse({ data: [entry] })).toEqual(entry);
  });

  it("rejects malformed, non-finite and out-of-range scores", () => {
    expect(() => parseFearGreedResponse({ data: null })).toThrow("Invalid Fear & Greed provider response");
    expect(() => parseFearGreedResponse({ data: [{ ...entry, value: "NaN" }] })).toThrow("Invalid Fear & Greed provider response");
    expect(() => parseFearGreedResponse({ data: [{ ...entry, value: "101" }] })).toThrow("Invalid Fear & Greed provider response");
  });
});
