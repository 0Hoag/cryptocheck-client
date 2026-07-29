import { describe, expect, it } from "vitest";
import type { CommunityPost, PostPermission } from "./social";

describe("community post permissions", () => {
  it("accepts the follower-only API permission", () => {
    const permission: PostPermission = "followers";
    const post: Pick<CommunityPost, "permission"> = { permission };
    expect(post.permission).toBe("followers");
  });
});
