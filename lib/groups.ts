import { apiClient } from "@/lib/api";

export type GroupMembership = {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "admin" | "moderator" | "member";
  status: "active" | "pending";
  created_at: string;
};

export type CommunityGroup = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  visibility: "public" | "private";
  join_policy: "open" | "approval" | "invite";
  created_at: string;
  membership?: GroupMembership;
};

export type GroupPost = {
  id: string;
  title?: string;
  content: string;
  author_id: string;
  created_at: string;
};

export type CreateGroupInput = {
  name: string;
  slug: string;
  description: string;
  avatar_url?: string;
  visibility: CommunityGroup["visibility"];
  join_policy: CommunityGroup["join_policy"];
};

type ListPayload = { data?: unknown };

function isGroup(value: unknown): value is CommunityGroup {
  if (!value || typeof value !== "object") return false;
  const group = value as Partial<CommunityGroup>;
  return typeof group.id === "string" && typeof group.name === "string" && typeof group.slug === "string";
}

function isGroupMembership(value: unknown): value is GroupMembership {
  if (!value || typeof value !== "object") return false;
  const membership = value as Partial<GroupMembership>;
  return typeof membership.id === "string" && typeof membership.group_id === "string" && typeof membership.user_id === "string";
}

function isGroupPost(value: unknown): value is GroupPost {
  if (!value || typeof value !== "object") return false;
  const post = value as Partial<GroupPost>;
  return typeof post.id === "string" && typeof post.content === "string" && typeof post.author_id === "string";
}

export function parseGroupListResponse<T>(payload: unknown, resource: string): T[] {
  const data = (payload as ListPayload | undefined)?.data;
  if (data == null) return [];
  if (!Array.isArray(data)) throw new Error(`Invalid ${resource} response`);
  return data as T[];
}

export function parseGroupResponse(payload: unknown, resource: string): CommunityGroup {
  const data = (payload as ListPayload | undefined)?.data;
  if (!isGroup(data)) throw new Error(`Invalid ${resource} response`);
  return data;
}

export function parseGroupMembershipResponse(payload: unknown, resource: string): GroupMembership {
  const data = (payload as ListPayload | undefined)?.data;
  if (!isGroupMembership(data)) throw new Error(`Invalid ${resource} response`);
  return data;
}

export function parseGroupPostResponse(payload: unknown, resource: string): GroupPost {
  const data = (payload as ListPayload | undefined)?.data;
  if (!isGroupPost(data)) throw new Error(`Invalid ${resource} response`);
  return data;
}

export async function getGroups() {
  const response = await apiClient.get<unknown>("/api/v1/news-feed/groups");
  return parseGroupListResponse<CommunityGroup>(response.data, "groups");
}

export async function getGroup(id: string) {
  const response = await apiClient.get<unknown>(`/api/v1/news-feed/groups/${id}`);
  return parseGroupResponse(response.data, "group");
}

export async function getGroupPosts(id: string) {
  const response = await apiClient.get<unknown>(`/api/v1/news-feed/groups/${id}/posts`);
  return parseGroupListResponse<GroupPost>(response.data, "group posts");
}

export async function createGroup(input: CreateGroupInput) {
  const response = await apiClient.post<unknown>("/api/v1/news-feed/groups", input);
  return parseGroupResponse(response.data, "created group");
}

export async function updateGroup(id: string, input: CreateGroupInput) {
  const response = await apiClient.patch<unknown>(`/api/v1/news-feed/groups/${id}`, input);
  return parseGroupResponse(response.data, "updated group");
}

export async function joinGroup(id: string) {
  const response = await apiClient.post<unknown>(`/api/v1/news-feed/groups/${id}/join`);
  return parseGroupMembershipResponse(response.data, "group membership");
}

export async function leaveGroup(id: string) {
  await apiClient.delete(`/api/v1/news-feed/groups/${id}/members/me`);
}

export async function deleteGroup(id: string) {
  await apiClient.delete(`/api/v1/news-feed/groups/${id}`);
}

export async function getGroupMembers(id: string) {
  const response = await apiClient.get<unknown>(`/api/v1/news-feed/groups/${id}/members`);
  return parseGroupListResponse<GroupMembership>(response.data, "group members");
}

export async function updateGroupMember(groupID: string, userID: string, update: Partial<Pick<GroupMembership, "role" | "status">>) {
  const response = await apiClient.patch<unknown>(`/api/v1/news-feed/groups/${groupID}/members/${userID}`, update);
  return parseGroupMembershipResponse(response.data, "updated group membership");
}

export async function createGroupPost(id: string, content: string, title = "") {
  const response = await apiClient.post<unknown>(`/api/v1/news-feed/groups/${id}/posts`, { content, title, source_url: "" });
  return parseGroupPostResponse(response.data, "group post");
}

export async function deleteGroupPost(groupID: string, postID: string) {
  await apiClient.delete(`/api/v1/news-feed/groups/${groupID}/posts/${postID}`);
}
