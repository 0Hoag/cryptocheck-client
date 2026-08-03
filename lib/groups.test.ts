import { describe, expect, it } from "vitest";
import { parseGroupListResponse, parseGroupResponse } from "./groups";

describe("parseGroupListResponse", () => {
  it("normalizes a legacy null list", () => {
    expect(parseGroupListResponse({ data: null }, "groups")).toEqual([]);
  });

  it("rejects a non-list payload", () => {
    expect(() => parseGroupListResponse({ data: {} }, "groups")).toThrow("Invalid groups response");
  });
});

describe("parseGroupResponse", () => {
  it("accepts a minimally renderable group detail", () => {
    expect(parseGroupResponse({ data: { id: "g1", name: "Traders", slug: "traders" } }, "group")).toMatchObject({ id: "g1", slug: "traders" });
  });

  it("rejects null or malformed group details before the route renders", () => {
    expect(() => parseGroupResponse({ data: null }, "group")).toThrow("Invalid group response");
    expect(() => parseGroupResponse({ data: { id: "g1" } }, "group")).toThrow("Invalid group response");
  });
});
