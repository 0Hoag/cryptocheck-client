import axios from "axios";
import { Post, PaginationParams, PostsResponse } from "./types";
import { clearAuth, getAuthToken } from "./auth";

// Production traffic should stay on the current origin. This lets the edge
// proxy (or Next's server rewrite) forward `/api` to the API container instead
// of trying to reach `localhost` on each visitor's device.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

type PostFeedPayload = { data?: { items?: unknown; meta?: unknown } };

function isPagination(value: unknown): value is NonNullable<PostsResponse["pagination"]> {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Record<string, unknown>;
    return ["total", "count", "per_page", "current_page", "total_pages"].every((key) => typeof candidate[key] === "number");
}

export function parsePostsResponse(payload: unknown): PostsResponse {
    const response = payload as PostFeedPayload;
    if (!Array.isArray(response?.data?.items)) throw new Error("Invalid post-feed response");
    if (response.data.meta !== undefined && !isPagination(response.data.meta)) throw new Error("Invalid post-feed pagination");
    return { posts: response.data.items as Post[], pagination: response.data.meta };
}

const apiClient = axios.create({
    baseURL: API_BASE_URL,
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
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export async function getPosts(params?: PaginationParams): Promise<PostsResponse> {
    try {
        const response = await apiClient.get<{ data: { items: Post[]; meta: NonNullable<PostsResponse["pagination"]> } }>("/api/v1/news-feed/posts", {
            params: {
                page: params?.page || 1,
                limit: params?.limit || 30,
                sort: params?.sort || "-created_at",
            },
        });
        // Backend returns {data: {items: [], meta: {}}}
        return parsePostsResponse(response.data);
    } catch (error) {
        console.error("Failed to fetch posts:", error);
        throw error;
    }
}

export async function getPostById(id: string): Promise<Post> {
    try {
        const response = await apiClient.get<{ data: Post }>(`/api/v1/news-feed/posts/${id}`);
        return response.data.data;
    } catch (error) {
        console.error(`Failed to fetch post ${id}:`, error);
        throw error;
    }
}

export { apiClient };
