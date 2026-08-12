import { describe, expect, it } from "vitest";
import { parseReportsResponse } from "./reports";

const report = {
  id: "report-1", target_type: "post", target_id: "post-1", reason: "Spam", status: "open", created_at: "2026-08-11T00:00:00Z", updated_at: "2026-08-11T00:00:00Z",
};

describe("parseReportsResponse", () => {
  it("keeps valid report lists", () => {
    expect(parseReportsResponse({ data: [report] })).toEqual([report]);
  });

  it("normalizes a legacy empty list", () => {
    expect(parseReportsResponse({ data: null })).toEqual([]);
  });

  it("drops malformed optional details before a report is rendered", () => {
    expect(parseReportsResponse({ data: [{ ...report, details: { unexpected: true } }] })).toEqual([
      expect.objectContaining({ id: report.id, details: undefined }),
    ]);
  });

  it("rejects malformed or unsupported report states", () => {
    expect(() => parseReportsResponse({ data: [{ ...report, status: "pending" }] })).toThrow("Invalid reports response");
  });
});
