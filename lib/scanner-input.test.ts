import { describe, expect, it } from "vitest";
import { isEvmAddress, isSolanaMintAddress, validateScanInput } from "./scanner-input";

describe("scanner input validation", () => {
  it("accepts complete EVM and Solana mint addresses", () => {
    expect(isEvmAddress("0x1234567890abcdef1234567890ABCDEF12345678")).toBe(true);
    expect(isSolanaMintAddress("So11111111111111111111111111111111111111112")).toBe(true);
    expect(validateScanInput("0x1234567890abcdef1234567890ABCDEF12345678")).toBeNull();
    expect(validateScanInput("So11111111111111111111111111111111111111112")).toBeNull();
  });

  it("rejects partial EVM, unknown direct addresses and oversized input", () => {
    expect(validateScanInput("0x1234")).toBe("invalid_evm");
    expect(validateScanInput("0".repeat(32))).toBe("unsupported_direct");
    expect(validateScanInput(`${"A".repeat(129)} `)).toBe("too_long");
  });

  it("allows symbols to go through candidate selection", () => {
    expect(validateScanInput("ENA")).toBeNull();
    expect(isEvmAddress("0xnot-an-address")).toBe(false);
    expect(isSolanaMintAddress("0OIl-not-base58")).toBe(false);
  });
});
