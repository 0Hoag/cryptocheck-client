import { describe, expect, it } from "vitest";
import { parseCommunityPostsPage, type CommunityPost, type PostPermission } from "./social";

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
