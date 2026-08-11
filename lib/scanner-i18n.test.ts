import { describe, expect, it } from "vitest";
import { localizeScannerFeature, localizeScannerIssue } from "@/lib/scanner-i18n";

describe("scanner result localization", () => {
  const report = {
    type: "info",
    name: "SPL mint authority report",
    description: "This is an on-chain authority check for a Solana SPL mint, not a full smart-contract audit.",
    impact: 0,
  };

  it("localizes deterministic Solana authority rules for Vietnamese", () => {
    expect(localizeScannerIssue(report, "vi")).toMatchObject({
      name: "Báo cáo quyền hạn SPL mint",
      description: "Đây là kiểm tra on-chain đối với quyền mint/freeze của Solana SPL mint, không phải audit toàn bộ smart contract.",
    });
    expect(localizeScannerFeature("Mint authority revoked", "vi")).toBe("Quyền mint đã được thu hồi");
  });

  it("keeps the deterministic English copy for English", () => {
    expect(localizeScannerIssue(report, "en")).toEqual(report);
    expect(localizeScannerFeature("Freeze authority revoked", "en")).toBe("Freeze authority revoked");
  });

  it("does not machine translate unknown provider or AI copy", () => {
    const providerIssue = { ...report, name: "Provider rule", description: "External provider copy" };
    expect(localizeScannerIssue(providerIssue, "vi")).toEqual(providerIssue);
    expect(localizeScannerFeature("AI-generated insight", "vi")).toBe("AI-generated insight");
  });
});
