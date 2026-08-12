import { toFiniteNumber } from "@/lib/market-data";

export type FearGreedData = {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
};

type ProviderPayload = { data?: unknown };

export function parseFearGreedResponse(payload: unknown): FearGreedData {
  const entry = (payload as ProviderPayload | null)?.data;
  if (!Array.isArray(entry) || entry.length === 0 || typeof entry[0] !== "object" || entry[0] === null) {
    throw new Error("Invalid Fear & Greed provider response");
  }

  const value = entry[0] as Record<string, unknown>;
  const score = toFiniteNumber(value.value);
  if (
    score === null || score < 0 || score > 100 ||
    typeof value.value_classification !== "string" || !value.value_classification.trim() ||
    typeof value.timestamp !== "string" || !value.timestamp.trim() ||
    typeof value.time_until_update !== "string" || !value.time_until_update.trim()
  ) {
    throw new Error("Invalid Fear & Greed provider response");
  }

  return {
    value: String(score),
    value_classification: value.value_classification,
    timestamp: value.timestamp,
    time_until_update: value.time_until_update,
  };
}
