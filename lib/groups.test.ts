import { describe, expect, it } from "vitest";
import { parseGroupListResponse, parseGroupMembershipResponse, parseGroupPostResponse, parseGroupResponse } from "./groups";

describe("parseGroupListResponse", () => {
  it("normalizes a legacy null list", () => {
    expect(parseGroupListResponse({ data: null }, "groups")).toEqual([]);
  });

  it("rejects a non-list payload", () => {
    expect(() => parseGroupListResponse({ data: {} }, "groups")).toThrow("Invalid groups response");
  });
});

describe("group mutation response contracts", () => {
  it("accepts minimally renderable membership and post responses", () => {
    expect(parseGroupMembershipResponse({ data: { id: "m1", group_id: "g1", user_id: "u1" } }, "group membership")).toMatchObject({ id: "m1" });
    expect(parseGroupPostResponse({ data: { id: "p1", content: "Hello", author_id: "u1" } }, "group post")).toMatchObject({ id: "p1" });
  });

  it("rejects malformed mutation responses before state is updated", () => {
    expect(() => parseGroupMembershipResponse({ data: null }, "group membership")).toThrow("Invalid group membership response");
    expect(() => parseGroupPostResponse({ data: { id: "p1" } }, "group post")).toThrow("Invalid group post response");
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
