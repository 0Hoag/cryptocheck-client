import { describe, expect, it } from "vitest";
import { parseGroupListResponse } from "./groups";

describe("parseGroupListResponse", () => {
  it("normalizes a legacy null list", () => {
    expect(parseGroupListResponse({ data: null }, "groups")).toEqual([]);
  });

  it("rejects a non-list payload", () => {
    expect(() => parseGroupListResponse({ data: {} }, "groups")).toThrow("Invalid groups response");
  });
});
