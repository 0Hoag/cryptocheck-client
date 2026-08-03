import { describe, expect, it } from "vitest";
import { parseCommunityPostsPage, parseFollowCounts, parseSocialList, type CommunityPost, type PostPermission } from "./social";

describe("community post permissions", () => {
  it("accepts the follower-only API permission", () => {
    const permission: PostPermission = "followers";
    const post: Pick<CommunityPost, "permission"> = { permission };
    expect(post.permission).toBe("followers");
  });

  it("validates profile-feed pagination before rendering it", () => {
    const payload = { data: { items: [{ id: "community", source_url: "" }, { id: "news", source_url: "https://example.test" }], meta: { current_page: 1, total_pages: 2 } } };
    expect(parseCommunityPostsPage(payload)).toEqual({ posts: [{ id: "community", source_url: "" }], page: 1, hasMore: true });
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
