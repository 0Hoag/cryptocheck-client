import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./api";
import {
  createComment,
  createFollow,
  createPost,
  createReaction,
  deleteCommunityPost,
  deleteFollow,
  deleteReaction,
  updateCommunityPost,
} from "./social";

afterEach(() => vi.restoreAllMocks());

describe("social mutation transport contracts", () => {
  it("sends a post with the documented visibility and empty attachment fields", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: { data: { id: "p1", content: "ETH thesis", author_id: "u1" } } } as never);

    await expect(createPost("ETH thesis", "followers")).resolves.toMatchObject({ id: "p1" });
    expect(post).toHaveBeenCalledWith("/api/v1/news-feed/posts", {
      content: "ETH thesis", permission: "followers", pin: false, file_ids: [], tagged_target: [],
    });
  });

  it("uses the reaction and comment endpoints with their required post identifiers", async () => {
    const post = vi.spyOn(apiClient, "post")
      .mockResolvedValueOnce({ data: { data: { id: "r1", post_id: "p1", author_id: "u1" } } } as never)
      .mockResolvedValueOnce({ data: { data: { id: "c1", post_id: "p1", author_id: "u1", content: "Useful risk note" } } } as never);

    await expect(createReaction("p1")).resolves.toMatchObject({ id: "r1" });
    await expect(createComment("p1", "Useful risk note")).resolves.toMatchObject({ id: "c1" });
    expect(post).toHaveBeenNthCalledWith(1, "/api/v1/news-feed/posts/reaction", { post_id: "p1", type: "like" });
    expect(post).toHaveBeenNthCalledWith(2, "/api/v1/news-feed/comment", { post_id: "p1", content: "Useful risk note" });
  });

  it("targets each edit, delete and follow mutation at its API resource", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({} as never);
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: { data: { id: "f1", author_id: "u1", followee_id: "u2" } } } as never);
    const remove = vi.spyOn(apiClient, "delete").mockResolvedValue({} as never);

    await updateCommunityPost("p1", "Updated thesis", "public");
    await createFollow("u2");
    await deleteCommunityPost("p1");
    await deleteReaction("r1");
    await deleteFollow("f1");

    expect(put).toHaveBeenCalledWith("/api/v1/news-feed/posts", { id: "p1", content: "Updated thesis", permission: "public", file_ids: [], tagged_target: [] });
    expect(post).toHaveBeenCalledWith("/api/v1/news-feed/follow", { followee_id: "u2" });
    expect(remove.mock.calls.map(([url]) => url)).toEqual([
      "/api/v1/news-feed/posts/p1",
      "/api/v1/news-feed/posts/reaction/r1",
      "/api/v1/news-feed/follow/f1",
    ]);
  });
});
