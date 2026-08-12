import { describe, expect, it } from "vitest";
import { isFiniteNumberString, toFiniteNumber } from "./market-data";

describe("market data numeric boundary", () => {
  it("accepts finite numeric provider values", () => {
    expect(toFiniteNumber("64232.04")).toBe(64232.04);
    expect(toFiniteNumber("-1.25")).toBe(-1.25);
    expect(toFiniteNumber(0)).toBe(0);
    expect(isFiniteNumberString("0.00001")).toBe(true);
  });

  it("rejects blank, malformed and non-finite provider values", () => {
    expect(toFiniteNumber(" ")).toBeNull();
    expect(toFiniteNumber("not-a-price")).toBeNull();
    expect(toFiniteNumber("Infinity")).toBeNull();
    expect(toFiniteNumber(null)).toBeNull();
    expect(isFiniteNumberString("NaN")).toBe(false);
  });
});
