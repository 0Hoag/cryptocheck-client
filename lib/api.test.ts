import { describe, expect, it } from "vitest";
import { apiClient, DEFAULT_API_TIMEOUT_MS, parseListData, parsePostsResponse } from "./api";

const post = {
  id: "post-1", pin: false, title: "Market update", content: "Body", permission: "public",
  author_id: "author-1", source_url: "", created_at: "2026-07-29T00:00:00Z", updated_at: "2026-07-29T00:00:00Z",
};

describe("post-feed API contract", () => {
  it("bounds ordinary UI requests while allowing individual endpoints to override it", () => {
    expect(apiClient.defaults.timeout).toBe(DEFAULT_API_TIMEOUT_MS);
    expect(DEFAULT_API_TIMEOUT_MS).toBe(15_000);
  });

  it("returns posts and valid pagination metadata", () => {
    expect(parsePostsResponse({ data: { items: [post], meta: { total: 13, count: 12, per_page: 12, current_page: 1, total_pages: 2 } } })).toEqual({
      posts: [post], pagination: { total: 13, count: 12, per_page: 12, current_page: 1, total_pages: 2 },
    });
  });

  it("allows an older response without pagination", () => {
    expect(parsePostsResponse({ data: { items: [] } })).toEqual({ posts: [], pagination: undefined });
  });

  it("normalizes legacy nullable list data and rejects malformed lists", () => {
    expect(parseListData<string>({ data: null }, "history")).toEqual([]);
    expect(parseListData<string>({ data: ["ENA"] }, "history")).toEqual(["ENA"]);
    expect(() => parseListData({ data: {} }, "history")).toThrow("Invalid history response");
  });

  it("rejects malformed feed and pagination payloads instead of rendering an empty page", () => {
    expect(() => parsePostsResponse({ data: { items: "not-an-array" } })).toThrow("Invalid post-feed response");
    expect(() => parsePostsResponse({ data: { items: [], meta: { total: "1" } } })).toThrow("Invalid post-feed pagination");
  });
});
