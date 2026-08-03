import { apiClient } from "./api";

export type CommunityAuthor = { id: string; username: string; avatar_url: string };
export type PostPermission = "public" | "justme" | "followers";
export type CommunityPost = { id: string; content: string; author_id: string; author: CommunityAuthor; permission: PostPermission; source_url?: string; created_at: string; reaction_count: number; comment_count: number };
export type Reaction = { id: string; post_id: string; author_id: string; type: string; created_at: string };
export type Comment = { id: string; post_id: string; author_id: string; content: string; created_at: string };
export type Follow = { id: string; author_id: string; followee_id: string; created_at: string };
type ListResponse<T> = { items: T[]; meta: { total?: number; total_pages?: number; current_page?: number } };
export type CommunityPostsPage = { posts: CommunityPost[]; page: number; hasMore: boolean };

type UnknownListPayload = { data?: { items?: unknown } | null };

export function parseSocialList<T>(payload: unknown, resource: string): T[] {
  const data = (payload as UnknownListPayload | undefined)?.data;
  if (data == null) return [];
  if (!Array.isArray(data.items)) throw new Error(`Invalid ${resource} response`);
  return data.items.filter((item): item is T => typeof item === "object" && item !== null);
}

export function parseFollowCounts(payload: unknown): { followers: number; following: number } {
  const data = (payload as { data?: unknown } | undefined)?.data;
  if (!data || typeof data !== "object") throw new Error("Invalid follow counts response");
  const counts = data as Record<string, unknown>;
  if (typeof counts.followers !== "number" || typeof counts.following !== "number") {
    throw new Error("Invalid follow counts response");
  }
  return { followers: counts.followers, following: counts.following };
}

function parseSocialMutation<T>(payload: unknown, resource: string, valid: (value: unknown) => value is T): T {
  const data = (payload as { data?: unknown } | undefined)?.data;
  if (!valid(data)) throw new Error(`Invalid ${resource} response`);
  return data;
}

function isCommunityPost(value: unknown): value is CommunityPost {
  if (!value || typeof value !== "object") return false;
  const post = value as Partial<CommunityPost>;
  return typeof post.id === "string" && typeof post.content === "string" && typeof post.author_id === "string";
}

function isReaction(value: unknown): value is Reaction {
  if (!value || typeof value !== "object") return false;
  const reaction = value as Partial<Reaction>;
  return typeof reaction.id === "string" && typeof reaction.post_id === "string";
}

function isComment(value: unknown): value is Comment {
  if (!value || typeof value !== "object") return false;
  const comment = value as Partial<Comment>;
  return typeof comment.id === "string" && typeof comment.post_id === "string" && typeof comment.content === "string";
}

function isFollow(value: unknown): value is Follow {
  if (!value || typeof value !== "object") return false;
  const follow = value as Partial<Follow>;
  return typeof follow.id === "string" && typeof follow.author_id === "string" && typeof follow.followee_id === "string";
}

export function parseCommunityPostResponse(payload: unknown, resource = "post") {
  return parseSocialMutation(payload, resource, isCommunityPost);
}

export function parseReactionResponse(payload: unknown, resource = "reaction") {
  return parseSocialMutation(payload, resource, isReaction);
}

export function parseCommentResponse(payload: unknown, resource = "comment") {
  return parseSocialMutation(payload, resource, isComment);
}

export function parseFollowResponse(payload: unknown, resource = "follow") {
  return parseSocialMutation(payload, resource, isFollow);
}

export function parseCommunityPostsPage(payload: unknown, page = 1, limit = 12): CommunityPostsPage {
  const response = payload as { data?: { items?: unknown; meta?: unknown } };
  if (!Array.isArray(response?.data?.items)) throw new Error("Invalid community-post response");
  const meta = response.data.meta;
  if (meta !== undefined && (typeof meta !== "object" || meta === null)) throw new Error("Invalid community-post pagination");
  const values = (meta ?? {}) as Record<string, unknown>;
  const currentPage = typeof values.current_page === "number" ? values.current_page : page;
  const totalPages = typeof values.total_pages === "number" ? values.total_pages : undefined;
  return {
    posts: response.data.items.filter((post): post is CommunityPost => typeof post === "object" && post !== null && !(post as CommunityPost).source_url),
    page: currentPage,
    hasMore: totalPages !== undefined ? currentPage < totalPages : response.data.items.length === limit,
  };
}

export async function getCommunityPosts(authorId?: string) {
  return (await getCommunityPostsPage(authorId, 1, 50)).posts;
}
export async function getCommunityPostsPage(authorId?: string, page = 1, limit = 12): Promise<CommunityPostsPage> {
  const response = await apiClient.get<{ data: ListResponse<CommunityPost> }>("/api/v1/news-feed/posts", { params: { page, limit, sort: "newest", author_id: authorId } });
  return parseCommunityPostsPage(response.data, page, limit);
}
export async function createPost(content: string, permission: PostPermission = "public") {
  const response = await apiClient.post<unknown>("/api/v1/news-feed/posts", { content, permission, pin: false, file_ids: [], tagged_target: [] });
  return parseCommunityPostResponse(response.data, "created post");
}
export async function updateCommunityPost(id: string, content: string, permission: PostPermission = "public") {
  await apiClient.put("/api/v1/news-feed/posts", { id, content, permission, file_ids: [], tagged_target: [] });
}
export async function deleteCommunityPost(id: string) { await apiClient.delete(`/api/v1/news-feed/posts/${id}`); }
export async function getReactions(postId: string) {
  const response = await apiClient.get<unknown>("/api/v1/news-feed/posts/reaction", { params: { post_id: postId, page: 1, limit: 100 } });
  return parseSocialList<Reaction>(response.data, "reactions");
}
export async function createReaction(postId: string) {
  const response = await apiClient.post<unknown>("/api/v1/news-feed/posts/reaction", { post_id: postId, type: "like" });
  return parseReactionResponse(response.data);
}
export async function deleteReaction(id: string) { await apiClient.delete(`/api/v1/news-feed/posts/reaction/${id}`); }
export async function getComments(postId: string) {
  const response = await apiClient.get<unknown>("/api/v1/news-feed/comment", { params: { post_id: postId, page: 1, limit: 50 } });
  return parseSocialList<Comment>(response.data, "comments");
}
export async function createComment(postId: string, content: string) {
  const response = await apiClient.post<unknown>("/api/v1/news-feed/comment", { post_id: postId, content });
  return parseCommentResponse(response.data);
}
export async function getFollows(authorId: string, followeeId?: string) {
  const response = await apiClient.get<unknown>("/api/v1/news-feed/follow", { params: { author_id: authorId, followee_id: followeeId, page: 1, limit: 1 } });
  return parseSocialList<Follow>(response.data, "follows");
}
export async function getFollowCounts(userId: string) {
  const response = await apiClient.get<unknown>(`/api/v1/news-feed/follow/counts/${userId}`);
  return parseFollowCounts(response.data);
}
export async function createFollow(followeeId: string) {
  const response = await apiClient.post<unknown>("/api/v1/news-feed/follow", { followee_id: followeeId });
  return parseFollowResponse(response.data);
}
export async function deleteFollow(id: string) { await apiClient.delete(`/api/v1/news-feed/follow/${id}`); }
