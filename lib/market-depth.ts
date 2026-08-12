import { toFiniteNumber } from "@/lib/market-data";

export type MarketDepthLevel = { price: number; amount: number };
export type MarketDepth = { asks: MarketDepthLevel[]; bids: MarketDepthLevel[] };

function parseSide(value: unknown): MarketDepthLevel[] | null {
  if (!Array.isArray(value)) return null;
  return value.flatMap((entry) => {
    if (!Array.isArray(entry) || entry.length < 2) return [];
    const price = toFiniteNumber(entry[0]);
    const amount = toFiniteNumber(entry[1]);
    return price !== null && amount !== null && price > 0 && amount > 0 ? [{ price, amount }] : [];
  });
}

export function parseMarketDepth(value: unknown): MarketDepth | null {
  if (typeof value !== "object" || value === null) return null;
  const payload = value as Record<string, unknown>;
  const asks = parseSide(payload.asks);
  const bids = parseSide(payload.bids);
  return asks && bids ? { asks, bids } : null;
}
