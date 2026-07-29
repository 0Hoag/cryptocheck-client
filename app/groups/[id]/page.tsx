"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Lock,
  Send,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import {
  CommunityGroup,
  CreateGroupInput,
  GroupMembership,
  GroupPost,
  createGroupPost,
  deleteGroup,
  deleteGroupPost,
  getGroup,
  getGroupMembers,
  getGroupPosts,
  joinGroup,
  leaveGroup,
  updateGroup,
  updateGroupMember,
} from "@/lib/groups";
import { getErrorMessage } from "@/lib/utils";
import { translate, useLanguage } from "@/context/LanguageContext";
import ExternalImage from "@/components/ExternalImage";

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { language } = useLanguage();
  const router = useRouter();
  const [groupID, setGroupID] = useState("");
  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [members, setMembers] = useState<GroupMembership[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [memberUpdatingID, setMemberUpdatingID] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [groupDeleting, setGroupDeleting] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);
  const [groupUpdating, setGroupUpdating] = useState(false);
  const [editForm, setEditForm] = useState<CreateGroupInput | null>(null);
  const [posting, setPosting] = useState(false);
  const [postDeletingID, setPostDeletingID] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    void params.then(({ id }) => setGroupID(id));
  }, [params]);

  const loadMembers = useCallback(
    async (id = groupID) => {
      if (!id || !getAuthToken()) {
        setMembers([]);
        setMembersError("");
        return;
      }
      setMembersLoading(true);
      setMembersError("");
      try {
        setMembers(await getGroupMembers(id));
      } catch (requestError) {
        setMembers([]);
        setMembersError(
          getErrorMessage(
            requestError,
            translate(
              language,
              "Không tải được danh sách thành viên.",
              "Unable to load the member list.",
            ),
          ),
        );
      } finally {
        setMembersLoading(false);
      }
    },
    [groupID, language],
  );

  const load = useCallback(
    async (id = groupID) => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const loadedGroup = await getGroup(id);
        setGroup(loadedGroup);
        setPosts(await getGroupPosts(id));
        if (getAuthToken()) {
          await loadMembers(id);
        } else {
          setMembers([]);
          setMembersError("");
        }
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            translate(
              language,
              "Không tải được group này. Có thể group riêng tư hoặc không còn tồn tại.",
              "Unable to load this group. It may be private or no longer exist.",
            ),
          ),
        );
        setGroup(null);
      } finally {
        setLoading(false);
      }
    },
    [groupID, language, loadMembers],
  );

  useEffect(() => {
    if (groupID) void load(groupID);
  }, [groupID, load]);

  async function join() {
    if (!group) return;
    setJoining(true);
    setError("");
    try {
      const membership = await joinGroup(group.id);
      setGroup((current) => (current ? { ...current, membership } : current));
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          translate(
            language,
            "Không thể tham gia group lúc này.",
            "Unable to join this group right now.",
          ),
        ),
      );
    } finally {
      setJoining(false);
    }
  }

  async function leave() {
    if (
      !group ||
      !window.confirm(
        translate(
          language,
          group.membership?.status === "pending"
            ? "Rút yêu cầu tham gia group này?"
            : "Rời khỏi group này?",
          group.membership?.status === "pending"
            ? "Withdraw your request to join this group?"
            : "Leave this group?",
        ),
      )
    )
      return;
    setLeaving(true);
    setError("");
    try {
      await leaveGroup(group.id);
      setGroup((current) =>
        current ? { ...current, membership: undefined } : current,
      );
      setMembers((current) =>
        current.filter(
          (member) => member.user_id !== group.membership?.user_id,
        ),
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          translate(
            language,
            "Không thể rời group lúc này.",
            "Unable to leave this group right now.",
          ),
        ),
      );
    } finally {
      setLeaving(false);
    }
  }

  async function removeGroup() {
    if (
      !group ||
      !window.confirm(
        translate(
          language,
          `Xóa group “${group.name}”? Toàn bộ group sẽ không còn hiển thị.`,
          `Delete “${group.name}”? The group will no longer be visible.`,
        ),
      )
    )
      return;
    setGroupDeleting(true);
    setError("");
    try {
      await deleteGroup(group.id);
      router.push("/groups");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          translate(
            language,
            "Không thể xóa group lúc này.",
            "Unable to delete this group right now.",
          ),
        ),
      );
      setGroupDeleting(false);
    }
  }

  function startEditingGroup() {
    if (!group) return;
    setEditForm({
      name: group.name,
      slug: group.slug,
      description: group.description || "",
      avatar_url: group.avatar_url || "",
      visibility: group.visibility,
      join_policy: group.join_policy,
    });
    setEditingGroup(true);
    setError("");
  }

  async function submitGroupUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!group || !editForm) return;
    setGroupUpdating(true);
    setError("");
    try {
      const updated = await updateGroup(group.id, editForm);
      setGroup(updated);
      setEditingGroup(false);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          translate(
            language,
            "Không thể cập nhật group lúc này.",
            "Unable to update this group right now.",
          ),
        ),
      );
    } finally {
      setGroupUpdating(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!group || !content.trim()) return;
    setPosting(true);
    setError("");
    try {
      const post = await createGroupPost(group.id, content.trim());
      setPosts((current) => [post, ...current]);
      setContent("");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          translate(
            language,
            "Không thể đăng bài vào group lúc này.",
            "Unable to post to this group right now.",
          ),
        ),
      );
    } finally {
      setPosting(false);
    }
  }

  async function updateMember(
    member: GroupMembership,
    update: Partial<Pick<GroupMembership, "role" | "status">>,
  ) {
    if (!group) return;
    setMemberUpdatingID(member.id);
    setError("");
    try {
      const updated = await updateGroupMember(group.id, member.user_id, update);
      setMembers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          translate(
            language,
            "Không thể cập nhật thành viên lúc này.",
            "Unable to update this member right now.",
          ),
        ),
      );
    } finally {
      setMemberUpdatingID("");
    }
  }

  async function removePost(post: GroupPost) {
    if (
      !group ||
      !window.confirm(
        translate(
          language,
          "Xóa bài viết này? Hành động này không thể hoàn tác.",
          "Delete this post? This action cannot be undone.",
        ),
      )
    )
      return;
    setPostDeletingID(post.id);
    setError("");
    try {
      await deleteGroupPost(group.id, post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          translate(
            language,
            "Không thể xóa bài viết lúc này.",
            "Unable to delete this post right now.",
          ),
        ),
      );
    } finally {
      setPostDeletingID("");
    }
  }

  const signedIn = Boolean(getAuthToken());
  const activeMember = group?.membership?.status === "active";
  const canManageMembers =
    group?.membership?.role === "owner" || group?.membership?.role === "admin";
  const canSetRoles = group?.membership?.role === "owner";
  const canModeratePosts =
    group?.membership?.role === "owner" ||
    group?.membership?.role === "admin" ||
    group?.membership?.role === "moderator";
  return (
    <main className="min-h-[calc(100vh-12rem)] px-4 py-8 sm:px-6 lg:py-12">
      <section className="mx-auto max-w-4xl">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {translate(language, "Tất cả group", "All groups")}
        </Link>
        {error && (
          <div
            role="alert"
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100"
          >
            <span>{error}</span>
            {groupID && (
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-lg border border-red-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/10"
              >
                {translate(language, "Thử lại", "Retry")}
              </button>
            )}
          </div>
        )}
        {loading ? (
          <div className="grid place-items-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-sky-400" />
          </div>
        ) : (
          group && (
            <>
              <section className="surface mt-5 p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <ExternalImage src={group.avatar_url} alt="" className="h-14 w-14 rounded-2xl border border-slate-700 object-cover" fallback={<span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-xl font-semibold text-sky-200">{group.name.slice(0, 1).toUpperCase()}</span>} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-semibold text-white">
                          {group.name}
                        </h1>
                        {group.visibility === "private" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-200">
                            <Lock className="h-3.5 w-3.5" />
                            {translate(language, "Riêng tư", "Private")}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        /{group.slug}
                      </p>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                        {group.description ||
                          translate(
                            language,
                            "Group này chưa có mô tả.",
                            "This group has no description yet.",
                          )}
                      </p>
                    </div>
                  </div>
                  {!signedIn ? (
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                    >
                      <UserPlus className="h-4 w-4" />
                      {translate(
                        language,
                        "Đăng nhập để tham gia",
                        "Sign in to join",
                      )}
                    </Link>
                  ) : !group.membership ? (
                    <button
                      type="button"
                      onClick={() => void join()}
                      disabled={joining || group.join_policy === "invite"}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {joining && <Loader2 className="h-4 w-4 animate-spin" />}
                      <UserPlus className="h-4 w-4" />
                      {group.join_policy === "invite"
                        ? translate(language, "Chỉ mời", "Invite only")
                        : group.join_policy === "approval"
                          ? translate(
                              language,
                              "Gửi yêu cầu",
                              "Request to join",
                            )
                          : translate(language, "Tham gia group", "Join group")}
                    </button>
                  ) : group.membership.role === "owner" ? (
                    <div className="flex flex-col items-stretch gap-2">
                      <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-center text-sm font-semibold text-emerald-200">
                        {translate(
                          language,
                          "Bạn là chủ group",
                          "You own this group",
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={startEditingGroup}
                        className="rounded-xl border border-sky-400/25 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/10"
                      >
                        {translate(language, "Chỉnh sửa group", "Edit group")}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void leave()}
                      disabled={leaving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/25 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {leaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      {activeMember
                        ? translate(language, "Rời group", "Leave group")
                        : translate(
                            language,
                            "Rút yêu cầu",
                            "Withdraw request",
                          )}
                    </button>
                  )}
                </div>
              </section>
              {editingGroup && editForm && (
                <form
                  onSubmit={submitGroupUpdate}
                  className="surface mt-5 grid gap-4 p-5 sm:grid-cols-2"
                >
                  <div className="sm:col-span-2">
                    <div className="eyebrow">
                      {translate(language, "Cài đặt group", "Group settings")}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {translate(
                        language,
                        "Group riêng tư yêu cầu Premium và luôn được API xác minh khi lưu.",
                        "Private groups require Premium and are always verified by the API when saved.",
                      )}
                    </p>
                  </div>
                  <label className="text-sm text-slate-300">
                    {translate(language, "Tên group", "Group name")}
                    <input
                      required
                      minLength={2}
                      maxLength={80}
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm((current) =>
                          current
                            ? { ...current, name: event.target.value }
                            : current,
                        )
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-400"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    Slug
                    <input
                      required
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      maxLength={80}
                      value={editForm.slug}
                      onChange={(event) =>
                        setEditForm((current) =>
                          current
                            ? {
                                ...current,
                                slug: event.target.value.toLowerCase().trim(),
                              }
                            : current,
                        )
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-400"
                    />
                  </label>
                  <label className="text-sm text-slate-300 sm:col-span-2">
                    {translate(language, "Mô tả", "Description")}
                    <textarea
                      maxLength={1000}
                      rows={3}
                      value={editForm.description}
                      onChange={(event) =>
                        setEditForm((current) =>
                          current
                            ? { ...current, description: event.target.value }
                            : current,
                        )
                      }
                      className="mt-1.5 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-400"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    {translate(language, "Quyền riêng tư", "Visibility")}
                    <select
                      value={editForm.visibility}
                      onChange={(event) =>
                        setEditForm((current) =>
                          current
                            ? {
                                ...current,
                                visibility: event.target
                                  .value as CreateGroupInput["visibility"],
                              }
                            : current,
                        )
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-400"
                    >
                      <option value="public">
                        {translate(language, "Công khai", "Public")}
                      </option>
                      <option value="private">
                        {translate(
                          language,
                          "Riêng tư (Premium)",
                          "Private (Premium)",
                        )}
                      </option>
                    </select>
                  </label>
                  <label className="text-sm text-slate-300">
                    {translate(language, "Cách tham gia", "Join policy")}
                    <select
                      value={editForm.join_policy}
                      onChange={(event) =>
                        setEditForm((current) =>
                          current
                            ? {
                                ...current,
                                join_policy: event.target
                                  .value as CreateGroupInput["join_policy"],
                              }
                            : current,
                        )
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-400"
                    >
                      <option value="open">
                        {translate(language, "Tham gia ngay", "Open")}
                      </option>
                      <option value="approval">
                        {translate(language, "Chờ duyệt", "Approval required")}
                      </option>
                      <option value="invite">
                        {translate(language, "Chỉ mời", "Invite only")}
                      </option>
                    </select>
                  </label>
                  <div className="flex gap-2 sm:col-span-2">
                    <button
                      disabled={groupUpdating}
                      className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {groupUpdating && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {translate(language, "Lưu thay đổi", "Save changes")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingGroup(false)}
                      disabled={groupUpdating}
                      className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      {translate(language, "Huỷ", "Cancel")}
                    </button>
                  </div>
                </form>
              )}
              {activeMember && (
                <form onSubmit={submit} className="surface mt-5 p-5">
                  <label className="sr-only" htmlFor="group-post">
                    {translate(language, "Nội dung bài viết", "Post content")}
                  </label>
                  <textarea
                    id="group-post"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    maxLength={10000}
                    rows={4}
                    placeholder={translate(
                      language,
                      "Chia sẻ góc nhìn với group…",
                      "Share an insight with the group…",
                    )}
                    className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-slate-500"
                  />
                  <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
                    <span className="text-xs text-slate-500">
                      {content.length}/10000
                    </span>
                    <button
                      disabled={posting || !content.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {posting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {translate(language, "Đăng bài", "Publish")}
                    </button>
                  </div>
                </form>
              )}
              <section className="mt-6">
                <div className="eyebrow">
                  <UsersRound className="h-4 w-4 text-sky-400" />
                  {translate(language, "Bài viết trong group", "Group posts")}
                </div>
                <div className="mt-4 space-y-3">
                  {posts.length ? (
                    posts.map((post) => {
                      const canDelete =
                        activeMember &&
                        (canModeratePosts ||
                          post.author_id === group.membership?.user_id);
                      return (
                        <article key={post.id} className="surface p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              {post.title && (
                                <h2 className="font-semibold text-white">
                                  {post.title}
                                </h2>
                              )}
                              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                                {post.content}
                              </p>
                            </div>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => void removePost(post)}
                                disabled={postDeletingID === post.id}
                                aria-label={translate(
                                  language,
                                  "Xóa bài viết",
                                  "Delete post",
                                )}
                                className="shrink-0 rounded-lg border border-red-400/25 p-2 text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                              >
                                {postDeletingID === post.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="surface p-8 text-center text-sm text-slate-400">
                      {translate(
                        language,
                        "Chưa có bài viết trong group này.",
                        "There are no posts in this group yet.",
                      )}
                    </div>
                  )}
                </div>
              </section>
              {group.membership?.role === "owner" && (
                <section className="mt-6 rounded-xl border border-red-500/25 bg-red-500/5 p-5">
                  <h2 className="font-semibold text-red-100">
                    {translate(language, "Khu vực nguy hiểm", "Danger zone")}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-red-100/70">
                    {translate(
                      language,
                      "Xóa group sẽ ẩn group khỏi cộng đồng. Chỉ chủ group mới có quyền này.",
                      "Deleting a group hides it from the community. Only the group owner can do this.",
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => void removeGroup()}
                    disabled={groupDeleting}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {groupDeleting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <Trash2 className="h-4 w-4" />
                    {translate(language, "Xóa group", "Delete group")}
                  </button>
                </section>
              )}
              {signedIn && (
                <section className="surface mt-6 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="eyebrow">
                      <UsersRound className="h-4 w-4 text-sky-400" />
                      {translate(language, "Thành viên", "Members")}
                    </div>
                    {membersLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
                    )}
                  </div>
                  {membersError ? (
                    <div
                      role="alert"
                      className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100"
                    >
                      <p>{membersError}</p>
                      <button
                        type="button"
                        onClick={() => void loadMembers()}
                        className="mt-2 font-semibold text-sky-300 hover:text-sky-100"
                      >
                        {translate(language, "Thử lại", "Retry")}
                      </button>
                    </div>
                  ) : members.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs"
                        >
                          <span className="font-mono text-slate-400">
                            …{member.user_id.slice(-5)}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 font-semibold ${member.status === "pending" ? "bg-amber-500/10 text-amber-200" : "bg-sky-500/10 text-sky-200"}`}
                          >
                            {member.status === "pending"
                              ? translate(language, "Chờ duyệt", "Pending")
                              : member.role === "owner"
                                ? translate(language, "Chủ group", "Owner")
                                : member.role === "admin"
                                  ? "Admin"
                                  : member.role === "moderator"
                                    ? translate(
                                        language,
                                        "Kiểm duyệt",
                                        "Moderator",
                                      )
                                    : translate(
                                        language,
                                        "Thành viên",
                                        "Member",
                                      )}
                          </span>
                          {canManageMembers && member.status === "pending" && (
                            <button
                              type="button"
                              disabled={memberUpdatingID === member.id}
                              onClick={() =>
                                void updateMember(member, { status: "active" })
                              }
                              className="rounded border border-emerald-400/25 px-1.5 py-0.5 font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50"
                            >
                              {translate(language, "Duyệt", "Approve")}
                            </button>
                          )}
                          {canSetRoles && member.role !== "owner" && (
                            <select
                              value={member.role}
                              disabled={memberUpdatingID === member.id}
                              onChange={(event) =>
                                void updateMember(member, {
                                  role: event.target
                                    .value as GroupMembership["role"],
                                })
                              }
                              aria-label={translate(
                                language,
                                "Đổi role thành viên",
                                "Change member role",
                              )}
                              className="rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-slate-200 disabled:opacity-50"
                            >
                              <option value="member">
                                {translate(language, "Thành viên", "Member")}
                              </option>
                              <option value="moderator">
                                {translate(language, "Kiểm duyệt", "Moderator")}
                              </option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    !membersLoading && (
                      <p className="mt-3 text-sm text-slate-400">
                        {translate(
                          language,
                          "Group chưa có thành viên để hiển thị.",
                          "This group has no members to show yet.",
                        )}
                      </p>
                    )
                  )}
                </section>
              )}
            </>
          )
        )}
      </section>
    </main>
  );
}
