import { describe, expect, it } from "vitest";
import { zoomLogicalRange } from "./chart-interactions";

describe("chart interaction helpers", () => {
  it("zooms in around the current viewport centre", () => {
    expect(zoomLogicalRange({ from: 0, to: 100 }, 0.5)).toEqual({ from: 25, to: 75 });
  });

  it("zooms out while preserving the current viewport centre", () => {
    expect(zoomLogicalRange({ from: 10, to: 30 }, 1.5)).toEqual({ from: 5, to: 35 });
  });

  it("keeps a minimum visible range and rejects invalid values", () => {
    expect(zoomLogicalRange({ from: 10, to: 11 }, 0.1)).toEqual({ from: 8, to: 13 });
    expect(zoomLogicalRange({ from: 10, to: 10 }, 0.5)).toBeNull();
    expect(zoomLogicalRange(null, 0.5)).toBeNull();
  });
});
