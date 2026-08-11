import { describe, expect, it } from "vitest";
import { parseScanHistory, parseScanQuota, parseScanResultResponse, parseTokenCandidates } from "./scanner-data";

describe("scanner response contracts", () => {
  it("normalizes nullable optional scanner collections", () => {
    const result = parseScanResultResponse({ data: {
      network: "bsc", name: "Example", address: "0x123", analysis_type: "contract", source_available: true, score_available: true, trust_score: 82,
      issues: null, safe_features: null, liquidity_usd: null,
    } });
    expect(result.issues).toEqual([]);
    expect(result.safe_features).toEqual([]);
    expect(result.liquidity_usd).toBeUndefined();
    expect(parseScanHistory({ data: null })).toEqual([]);
    expect(parseTokenCandidates({ data: null })).toEqual([]);
  });

  it("rejects a malformed scanner result before rendering", () => {
    expect(() => parseScanResultResponse({ data: { name: "Missing identity" } })).toThrow("Invalid scanner response");
  });

  it("requires an identifiable candidate and normalizes missing market numbers", () => {
    expect(parseTokenCandidates({ data: [{ address: "0x123", network: "bsc", name: "Example", symbol: "EX" }] })).toEqual([expect.objectContaining({ liquidity_usd: 0, volume_h24: 0, price_usd: 0, contract_scan_supported: false })]);
    expect(() => parseTokenCandidates({ data: [{ name: "Missing address" }] })).toThrow("Invalid scanner candidates response");
  });

  it("accepts valid quota and rejects malformed quota payloads", () => {
    expect(parseScanQuota({ data: { plan: "free", limit: 2, used: 1, unlimited: false } })).toEqual({ plan: "free", limit: 2, used: 1, unlimited: false });
    expect(() => parseScanQuota({ data: { plan: "free" } })).toThrow("Invalid scanner quota response");
  });
});
