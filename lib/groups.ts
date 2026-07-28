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

export async function getGroups() {
  return (await apiClient.get<{ data: CommunityGroup[] }>("/api/v1/news-feed/groups")).data.data;
}

export async function getGroup(id: string) {
  return (await apiClient.get<{ data: CommunityGroup }>(`/api/v1/news-feed/groups/${id}`)).data.data;
}

export async function getGroupPosts(id: string) {
  return (await apiClient.get<{ data: GroupPost[] }>(`/api/v1/news-feed/groups/${id}/posts`)).data.data;
}

export async function createGroup(input: CreateGroupInput) {
  return (await apiClient.post<{ data: CommunityGroup }>("/api/v1/news-feed/groups", input)).data.data;
}

export async function updateGroup(id: string, input: CreateGroupInput) {
  return (await apiClient.patch<{ data: CommunityGroup }>(`/api/v1/news-feed/groups/${id}`, input)).data.data;
}

export async function joinGroup(id: string) {
  return (await apiClient.post<{ data: GroupMembership }>(`/api/v1/news-feed/groups/${id}/join`)).data.data;
}

export async function leaveGroup(id: string) {
  await apiClient.delete(`/api/v1/news-feed/groups/${id}/members/me`);
}

export async function deleteGroup(id: string) {
  await apiClient.delete(`/api/v1/news-feed/groups/${id}`);
}

export async function getGroupMembers(id: string) {
  return (await apiClient.get<{ data: GroupMembership[] }>(`/api/v1/news-feed/groups/${id}/members`)).data.data;
}

export async function updateGroupMember(groupID: string, userID: string, update: Partial<Pick<GroupMembership, "role" | "status">>) {
  return (await apiClient.patch<{ data: GroupMembership }>(`/api/v1/news-feed/groups/${groupID}/members/${userID}`, update)).data.data;
}

export async function createGroupPost(id: string, content: string, title = "") {
  return (await apiClient.post<{ data: GroupPost }>(`/api/v1/news-feed/groups/${id}/posts`, { content, title, source_url: "" })).data.data;
}

export async function deleteGroupPost(groupID: string, postID: string) {
  await apiClient.delete(`/api/v1/news-feed/groups/${groupID}/posts/${postID}`);
}
