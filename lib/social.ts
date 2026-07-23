import { apiClient } from "@/lib/api";

export type CommunityAuthor = { id: string; username: string; avatar_url: string };
export type CommunityPost = { id: string; content: string; author_id: string; author: CommunityAuthor; permission: "public" | "justme"; source_url?: string; created_at: string; reaction_count: number; comment_count: number };
export type Reaction = { id: string; post_id: string; author_id: string; type: string; created_at: string };
export type Comment = { id: string; post_id: string; author_id: string; content: string; created_at: string };
export type Follow = { id: string; author_id: string; followee_id: string; created_at: string };
type ListResponse<T> = { items: T[]; meta: { total?: number; total_pages?: number } };

export async function getCommunityPosts(authorId?: string) {
  const response = await apiClient.get<{ data: ListResponse<CommunityPost> }>("/api/v1/news-feed/posts", { params: { page: 1, limit: 50, sort: "-created_at", author_id: authorId } });
  return response.data.data.items.filter((post) => !post.source_url);
}
export async function createPost(content: string) { return (await apiClient.post<{ data: CommunityPost }>("/api/v1/news-feed/posts", { content, permission: "public", pin: false, file_ids: [], tagged_target: [] })).data.data; }
export async function updateCommunityPost(id: string, content: string) {
  await apiClient.put("/api/v1/news-feed/posts", { id, content, permission: "public", file_ids: [], tagged_target: [] });
}
export async function deleteCommunityPost(id: string) { await apiClient.delete(`/api/v1/news-feed/posts/${id}`); }
export async function getReactions(postId: string) { return (await apiClient.get<{ data: ListResponse<Reaction> }>("/api/v1/news-feed/posts/reaction", { params: { post_id: postId, page: 1, limit: 100 } })).data.data.items; }
export async function createReaction(postId: string) { return (await apiClient.post<{ data: Reaction }>("/api/v1/news-feed/posts/reaction", { post_id: postId, type: "like" })).data.data; }
export async function deleteReaction(id: string) { await apiClient.delete(`/api/v1/news-feed/posts/reaction/${id}`); }
export async function getComments(postId: string) { return (await apiClient.get<{ data: ListResponse<Comment> }>("/api/v1/news-feed/comment", { params: { post_id: postId, page: 1, limit: 50 } })).data.data.items; }
export async function createComment(postId: string, content: string) { return (await apiClient.post<{ data: Comment }>("/api/v1/news-feed/comment", { post_id: postId, content })).data.data; }
export async function getFollows(authorId: string, followeeId?: string) {
  return (await apiClient.get<{ data: ListResponse<Follow> }>("/api/v1/news-feed/follow", { params: { author_id: authorId, followee_id: followeeId, page: 1, limit: 1 } })).data.data.items;
}
export async function getFollowCounts(userId: string) {
  const [followers, following] = await Promise.all([
    apiClient.get<{ data: ListResponse<Follow> }>("/api/v1/news-feed/follow", { params: { followee_id: userId, page: 1, limit: 1 } }),
    apiClient.get<{ data: ListResponse<Follow> }>("/api/v1/news-feed/follow", { params: { author_id: userId, page: 1, limit: 1 } }),
  ]);
  return { followers: followers.data.data.meta.total || 0, following: following.data.data.meta.total || 0 };
}
export async function createFollow(followeeId: string) { return (await apiClient.post<{ data: Follow }>("/api/v1/news-feed/follow", { followee_id: followeeId })).data.data; }
export async function deleteFollow(id: string) { await apiClient.delete(`/api/v1/news-feed/follow/${id}`); }
