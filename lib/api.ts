import axios from "axios";
import { FeedSort, Post, PaginationParams, PostsResponse } from "./types";
import { clearAuth, getAuthToken } from "./auth";

// Production traffic should stay on the current origin. This lets the edge
// proxy (or Next's server rewrite) forward `/api` to the API container instead
// of trying to reach `localhost` on each visitor's device.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
// Routine UI reads should fail visibly instead of keeping a page in a loading
// state indefinitely when an origin/proxy is unavailable. Scanner requests
// deliberately override this with their longer provider-aware timeout.
export const DEFAULT_API_TIMEOUT_MS = 15_000;

type PostFeedPayload = { data?: { items?: unknown; meta?: unknown } };
type ListDataPayload = { data?: unknown };

function normalizePost(value: unknown): Post | null {
    if (!value || typeof value !== "object") return null;
    const post = value as Record<string, unknown>;
    if (typeof post.id !== "string" || !post.id || typeof post.content !== "string" || typeof post.author_id !== "string" || !post.author_id) return null;
    const author = post.author && typeof post.author === "object" ? post.author as Record<string, unknown> : undefined;
    return {
        id: post.id,
        pin: post.pin === true,
        title: typeof post.title === "string" ? post.title : "",
        content: post.content,
        file_ids: Array.isArray(post.file_ids) ? post.file_ids.filter((id): id is string => typeof id === "string") : [],
        tagged_target: Array.isArray(post.tagged_target) ? post.tagged_target.filter((target): target is string => typeof target === "string") : [],
        permission: post.permission === "followers" || post.permission === "justme" ? post.permission : "public",
        author_id: post.author_id,
        source_url: typeof post.source_url === "string" ? post.source_url : "",
        created_at: typeof post.created_at === "string" ? post.created_at : "",
        updated_at: typeof post.updated_at === "string" ? post.updated_at : "",
        deleted_at: typeof post.deleted_at === "string" || post.deleted_at === null ? post.deleted_at : undefined,
        reaction_count: typeof post.reaction_count === "number" && Number.isFinite(post.reaction_count) && post.reaction_count >= 0 ? post.reaction_count : 0,
        comment_count: typeof post.comment_count === "number" && Number.isFinite(post.comment_count) && post.comment_count >= 0 ? post.comment_count : 0,
        author: author && typeof author.id === "string" && typeof author.username === "string"
            ? { id: author.id, username: author.username, avatar_url: typeof author.avatar_url === "string" ? author.avatar_url : undefined }
            : undefined,
    };
}

export function parsePostResponse(payload: unknown, resource = "post"): Post {
    const post = normalizePost((payload as { data?: unknown } | undefined)?.data);
    if (!post) throw new Error(`Invalid ${resource} response`);
    return post;
}

function isPagination(value: unknown): value is NonNullable<PostsResponse["pagination"]> {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Record<string, unknown>;
    return ["total", "count", "per_page", "current_page", "total_pages"].every((key) => typeof candidate[key] === "number");
}

export function parsePostsResponse(payload: unknown): PostsResponse {
    const response = payload as PostFeedPayload;
    if (!Array.isArray(response?.data?.items)) throw new Error("Invalid post-feed response");
    if (response.data.meta !== undefined && !isPagination(response.data.meta)) throw new Error("Invalid post-feed pagination");
    return { posts: response.data.items.flatMap((item) => {
        const post = normalizePost(item);
        return post ? [post] : [];
    }), pagination: response.data.meta };
}

export type PostFeedQuery = { page: number; limit: number; sort: FeedSort };

// Keep the browser contract aligned with the API's validated sort values.
// This also prevents legacy Mongo-style sort strings from returning later.
export function buildPostFeedQuery(params?: PaginationParams): PostFeedQuery {
    return {
        page: params?.page || 1,
        limit: params?.limit || 30,
        sort: params?.sort || "newest",
    };
}

// Several legacy list endpoints respond with `data: null` for an empty list.
// Normalize that transport quirk at the boundary so screens never render
// `.length`/`.map` against null.
export function parseListData<T>(payload: unknown, resource: string): T[] {
    const data = (payload as ListDataPayload | undefined)?.data;
    if (data == null) return [];
    if (!Array.isArray(data)) throw new Error(`Invalid ${resource} response`);
    return data as T[];
}

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_API_TIMEOUT_MS,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) clearAuth();
        return Promise.reject(error);
    }
);

export async function getPosts(params?: PaginationParams): Promise<PostsResponse> {
    const response = await apiClient.get<{ data: { items: Post[]; meta: NonNullable<PostsResponse["pagination"]> } }>("/api/v1/news-feed/posts", {
        params: buildPostFeedQuery(params),
    });
    // Backend returns {data: {items: [], meta: {}}}
    return parsePostsResponse(response.data);
}

export async function getPostById(id: string): Promise<Post> {
    const response = await apiClient.get<unknown>(`/api/v1/news-feed/posts/${id}`);
    return parsePostResponse(response.data);
}

export { apiClient };
