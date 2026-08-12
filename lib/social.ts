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

export function parseSocialList<T>(payload: unknown, resource: string, isValid?: (value: unknown) => value is T): T[] {
  const data = (payload as UnknownListPayload | undefined)?.data;
  if (data == null) return [];
  if (!Array.isArray(data.items)) throw new Error(`Invalid ${resource} response`);
  return data.items.filter((item): item is T => isValid ? isValid(item) : typeof item === "object" && item !== null);
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

function normalizeCommunityPost(value: unknown): CommunityPost | null {
  if (!value || typeof value !== "object") return null;
  const post = value as Record<string, unknown>;
  if (typeof post.id !== "string" || !post.id || typeof post.content !== "string" || typeof post.author_id !== "string" || !post.author_id) return null;
  const author = post.author && typeof post.author === "object" ? post.author as Record<string, unknown> : null;
  const authorID = typeof author?.id === "string" && author.id ? author.id : post.author_id;
  const username = typeof author?.username === "string" ? author.username : "";
  const avatarURL = typeof author?.avatar_url === "string" ? author.avatar_url : "";
  return {
    id: post.id,
    content: post.content,
    author_id: post.author_id,
    author: { id: authorID, username, avatar_url: avatarURL },
    permission: post.permission === "followers" || post.permission === "justme" ? post.permission : "public",
    source_url: typeof post.source_url === "string" ? post.source_url : undefined,
    created_at: typeof post.created_at === "string" ? post.created_at : "",
    reaction_count: typeof post.reaction_count === "number" && Number.isFinite(post.reaction_count) && post.reaction_count >= 0 ? post.reaction_count : 0,
    comment_count: typeof post.comment_count === "number" && Number.isFinite(post.comment_count) && post.comment_count >= 0 ? post.comment_count : 0,
  };
}

function isReaction(value: unknown): value is Reaction {
  if (!value || typeof value !== "object") return false;
  const reaction = value as Partial<Reaction>;
  return typeof reaction.id === "string" && Boolean(reaction.id) && typeof reaction.post_id === "string" && Boolean(reaction.post_id) && typeof reaction.author_id === "string" && Boolean(reaction.author_id);
}

function isComment(value: unknown): value is Comment {
  if (!value || typeof value !== "object") return false;
  const comment = value as Partial<Comment>;
  return typeof comment.id === "string" && Boolean(comment.id) && typeof comment.post_id === "string" && Boolean(comment.post_id) && typeof comment.author_id === "string" && Boolean(comment.author_id) && typeof comment.content === "string";
}

function isFollow(value: unknown): value is Follow {
  if (!value || typeof value !== "object") return false;
  const follow = value as Partial<Follow>;
  return typeof follow.id === "string" && typeof follow.author_id === "string" && typeof follow.followee_id === "string";
}

export function parseCommunityPostResponse(payload: unknown, resource = "post") {
  const data = (payload as { data?: unknown } | undefined)?.data;
  const post = normalizeCommunityPost(data);
  if (!post) throw new Error(`Invalid ${resource} response`);
  return post;
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
  const posts = response.data.items.flatMap((value) => {
    const post = normalizeCommunityPost(value);
    return post && !post.source_url ? [post] : [];
  });
  return {
    posts,
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
  return parseSocialList<Reaction>(response.data, "reactions", isReaction);
}
export async function createReaction(postId: string) {
  const response = await apiClient.post<unknown>("/api/v1/news-feed/posts/reaction", { post_id: postId, type: "like" });
  return parseReactionResponse(response.data);
}
export async function deleteReaction(id: string) { await apiClient.delete(`/api/v1/news-feed/posts/reaction/${id}`); }
export async function getComments(postId: string) {
  const response = await apiClient.get<unknown>("/api/v1/news-feed/comment", { params: { post_id: postId, page: 1, limit: 50 } });
  return parseSocialList<Comment>(response.data, "comments", isComment);
}
export async function createComment(postId: string, content: string) {
  const response = await apiClient.post<unknown>("/api/v1/news-feed/comment", { post_id: postId, content });
  return parseCommentResponse(response.data);
}
export async function getFollows(authorId: string, followeeId?: string) {
  const response = await apiClient.get<unknown>("/api/v1/news-feed/follow", { params: { author_id: authorId, followee_id: followeeId, page: 1, limit: 1 } });
  return parseSocialList<Follow>(response.data, "follows", isFollow);
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
