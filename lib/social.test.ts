import { describe, expect, it } from "vitest";
import { parseCommentResponse, parseCommunityPostResponse, parseCommunityPostsPage, parseFollowCounts, parseFollowResponse, parseReactionResponse, parseSocialList, type CommunityPost, type PostPermission } from "./social";

describe("community post permissions", () => {
  it("accepts the follower-only API permission", () => {
    const permission: PostPermission = "followers";
    const post: Pick<CommunityPost, "permission"> = { permission };
    expect(post.permission).toBe("followers");
  });

  it("validates profile-feed pagination before rendering it", () => {
    const payload = { data: { items: [{ id: "community", content: "Safe thesis", author_id: "user-1", source_url: "" }, { id: "news", content: "Crawler item", author_id: "bot-1", source_url: "https://example.test" }], meta: { current_page: 1, total_pages: 2 } } };
    expect(parseCommunityPostsPage(payload)).toEqual(expect.objectContaining({ posts: [expect.objectContaining({ id: "community", permission: "public", reaction_count: 0 })], page: 1, hasMore: true }));
    expect(() => parseCommunityPostsPage({ data: { items: "bad" } })).toThrow("Invalid community-post response");
    expect(() => parseCommunityPostsPage({ data: { items: [], meta: "bad" } })).toThrow("Invalid community-post pagination");
  });
});

describe("social response contracts", () => {
  it("normalizes legacy null reaction/comment/follow lists", () => {
    expect(parseSocialList({ data: null }, "comments")).toEqual([]);
    expect(parseSocialList({ data: { items: [{ id: "safe" }, null] } }, "comments")).toEqual([{ id: "safe" }]);
  });

  it("rejects malformed lists and follow counts before social screens render", () => {
    expect(() => parseSocialList({ data: { items: {} } }, "follows")).toThrow("Invalid follows response");
    expect(parseFollowCounts({ data: { followers: 4, following: 2 } })).toEqual({ followers: 4, following: 2 });
    expect(() => parseFollowCounts({ data: null })).toThrow("Invalid follow counts response");
  });
});

describe("social mutation response contracts", () => {
  it("accepts the minimum fields needed by each mutation caller", () => {
    expect(parseCommunityPostResponse({ data: { id: "p1", content: "Hello", author_id: "u1" } })).toMatchObject({ id: "p1", permission: "public" });
    expect(parseReactionResponse({ data: { id: "r1", post_id: "p1", author_id: "u1" } })).toMatchObject({ id: "r1" });
    expect(parseCommentResponse({ data: { id: "c1", post_id: "p1", author_id: "u1", content: "Nice" } })).toMatchObject({ id: "c1" });
    expect(parseFollowResponse({ data: { id: "f1", author_id: "u1", followee_id: "u2" } })).toMatchObject({ id: "f1" });
  });

  it("rejects malformed mutation objects before UI state changes", () => {
    expect(() => parseCommunityPostResponse({ data: null })).toThrow("Invalid post response");
    expect(() => parseReactionResponse({ data: { id: "r1", post_id: "p1" } })).toThrow("Invalid reaction response");
    expect(() => parseCommentResponse({ data: { id: "c1", post_id: "p1", content: "Missing author" } })).toThrow("Invalid comment response");
    expect(() => parseFollowResponse({ data: { id: "f1", author_id: "u1" } })).toThrow("Invalid follow response");
  });
});
