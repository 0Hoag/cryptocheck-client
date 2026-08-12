import { describe, expect, it } from "vitest";
import { parseMarketDepth } from "./market-depth";

describe("market depth payload", () => {
  it("keeps valid positive price levels", () => {
    expect(parseMarketDepth({ asks: [["64232.04", "0.25"]], bids: [["64231.98", "1.5"]] })).toEqual({
      asks: [{ price: 64232.04, amount: 0.25 }],
      bids: [{ price: 64231.98, amount: 1.5 }],
    });
  });

  it("rejects a missing side and drops malformed levels", () => {
    expect(parseMarketDepth({ asks: [] })).toBeNull();
    expect(parseMarketDepth({ asks: [["NaN", "1"], ["10", "0"]], bids: [["9", "2"]] })).toEqual({
      asks: [],
      bids: [{ price: 9, amount: 2 }],
    });
  });
});
