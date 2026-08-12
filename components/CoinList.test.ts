import { describe, expect, it } from "vitest";
import { createInitialCoins, type CoinDefinition } from "./CoinList";

describe("createInitialCoins", () => {
  it("does not present unavailable provider data as a zero-priced asset", () => {
    const coins = createInitialCoins([
      { id: "1", symbol: "BTCUSDT", name: "Bitcoin" },
    ] satisfies CoinDefinition[]);

    expect(coins).toEqual([
      expect.objectContaining({ price: null, change: null, changePercent: null }),
    ]);
  });
});
