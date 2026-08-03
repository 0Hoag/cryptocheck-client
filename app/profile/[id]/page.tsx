"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, Pencil, Trash2, UserCheck, UserPlus, UserRound, X } from "lucide-react";
import { AuthUser, getAuthUser } from "@/lib/auth";
import { CommunityPost, Follow, createFollow, deleteCommunityPost, deleteFollow, getCommunityPostsPage, getFollowCounts, getFollows, updateCommunityPost } from "@/lib/social";
import { getErrorMessage } from "@/lib/utils";
import { translate, useLanguage } from "@/context/LanguageContext";

type FailedPostMutation =
  | { kind: "save"; postId: string; content: string }
  | { kind: "delete"; postId: string };

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { language } = useLanguage();
  const { id } = use(params);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postPage, setPostPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [viewer, setViewer] = useState<AuthUser | null>(null);
  const [follow, setFollow] = useState<Follow | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");
  const [followError, setFollowError] = useState("");
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [postMutationId, setPostMutationId] = useState<string | null>(null);
  const [postError, setPostError] = useState("");
  const [failedPostMutation, setFailedPostMutation] = useState<FailedPostMutation | null>(null);

  useEffect(() => {
    const session = getAuthUser();
    let cancelled = false;
    setViewer(session);
    setLoading(true);
    setError("");
    setLoadMoreError("");
    setFollow(null);

    Promise.all([
      getCommunityPostsPage(id),
      session && session.id !== id ? getFollows(session.id, id) : Promise.resolve([]),
      getFollowCounts(id),
    ])
      .then(([profilePosts, follows, followCounts]) => {
        if (cancelled) return;
        setPosts(profilePosts.posts);
        setPostPage(profilePosts.page);
        setHasMorePosts(profilePosts.hasMore);
        setFollow(follows[0] || null);
        setCounts(followCounts);
      })
      .catch((requestError) => {
        if (!cancelled) setError(getErrorMessage(requestError, translate(language, "Không tải được hồ sơ hoặc bài viết của thành viên này.", "Unable to load this member profile or posts.")));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, language, reloadKey]);

  const own = viewer?.id === id;
  const name = own ? viewer.username : `${translate(language, "Nhà đầu tư", "Investor")} ${id.slice(-4)}`;

  async function toggleFollow() {
    if (!viewer) return;
    setFollowLoading(true);
    setFollowError("");
    try {
      if (follow) {
        await deleteFollow(follow.id);
        setFollow(null);
        setCounts((current) => ({ ...current, followers: Math.max(0, current.followers - 1) }));
      } else {
        setFollow(await createFollow(id));
        setCounts((current) => ({ ...current, followers: current.followers + 1 }));
      }
    } catch (requestError) {
      setFollowError(getErrorMessage(requestError, translate(language, "Không thể cập nhật trạng thái theo dõi lúc này.", "Unable to update follow status right now.")));
    } finally {
      setFollowLoading(false);
    }
  }

  function startEditing(post: CommunityPost) {
    setPostError("");
    setFailedPostMutation(null);
    setDraftContent(post.content);
    setEditingPostId(post.id);
  }

  async function savePost(post: CommunityPost, contentToSave = draftContent) {
    const content = contentToSave.trim();
    if (!content) {
      setPostError(translate(language, "Nội dung bài viết không được để trống.", "Post content cannot be empty."));
      return;
    }
    setPostMutationId(post.id);
    setPostError("");
    setFailedPostMutation(null);
    try {
      await updateCommunityPost(post.id, content);
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, content } : item));
      setEditingPostId(null);
      setDraftContent("");
    } catch (requestError) {
      setPostError(getErrorMessage(requestError, translate(language, "Không thể cập nhật bài viết lúc này.", "Unable to update this post right now.")));
      setFailedPostMutation({ kind: "save", postId: post.id, content });
    } finally {
      setPostMutationId(null);
    }
  }

  async function removePost(post: CommunityPost, confirmDeletion = true) {
    if (confirmDeletion && !window.confirm(translate(language, "Xoá bài viết này? Thao tác này không thể hoàn tác.", "Delete this post? This action cannot be undone."))) return;
    setPostMutationId(post.id);
    setPostError("");
    setFailedPostMutation(null);
    try {
      await deleteCommunityPost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      if (editingPostId === post.id) {
        setEditingPostId(null);
        setDraftContent("");
      }
    } catch (requestError) {
      setPostError(getErrorMessage(requestError, translate(language, "Không thể xoá bài viết lúc này.", "Unable to delete this post right now.")));
      setFailedPostMutation({ kind: "delete", postId: post.id });
    } finally {
      setPostMutationId(null);
    }
  }

  async function retryPostMutation() {
    if (!failedPostMutation) return;
    const post = posts.find((item) => item.id === failedPostMutation.postId);
    if (!post) {
      setFailedPostMutation(null);
      return;
    }
    if (failedPostMutation.kind === "save") {
      setEditingPostId(post.id);
      setDraftContent(failedPostMutation.content);
      await savePost(post, failedPostMutation.content);
      return;
    }
    await removePost(post, false);
  }

  async function loadMorePosts() {
    setLoadingMorePosts(true);
    setLoadMoreError("");
    try {
      const next = await getCommunityPostsPage(id, postPage + 1);
      setPosts((current) => {
        const known = new Set(current.map((item) => item.id));
        return [...current, ...next.posts.filter((item) => !known.has(item.id))];
      });
      setPostPage(next.page);
      setHasMorePosts(next.hasMore);
    } catch (requestError) {
      setLoadMoreError(getErrorMessage(requestError, translate(language, "Không thể tải thêm bài viết lúc này.", "Unable to load more posts right now.")));
    } finally {
      setLoadingMorePosts(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/community" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />{translate(language, "Cộng đồng", "Community")}</Link>
        <section className="surface mt-5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-sky-500/15 text-sky-300"><UserRound className="h-7 w-7" /></div>
              <div><h1 className="text-xl font-semibold text-white">{name}</h1><p className="mt-1 text-sm text-slate-400">{own ? translate(language, "Hồ sơ và bài viết của bạn", "Your profile and posts") : translate(language, "Thành viên CryptoCheck", "CryptoCheck member")}</p><div className="mt-2 flex gap-4 text-xs text-slate-400"><span><strong className="text-slate-200">{counts.followers}</strong> {translate(language, "người theo dõi", "followers")}</span><span><strong className="text-slate-200">{counts.following}</strong> {translate(language, "đang theo dõi", "following")}</span></div></div>
            </div>
            {!own && (viewer ? <button type="button" onClick={toggleFollow} disabled={followLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60">{followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : follow ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}{follow ? translate(language, "Đang theo dõi", "Following") : translate(language, "Theo dõi", "Follow")}</button> : <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"><UserPlus className="h-4 w-4" />{translate(language, "Đăng nhập để theo dõi", "Sign in to follow")}</Link>)}
          </div>
          {followError && <div role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"><p>{followError}</p><button type="button" onClick={() => void toggleFollow()} disabled={followLoading} className="mt-2 text-xs font-semibold text-red-100 underline underline-offset-2 disabled:opacity-60">{translate(language, "Thử lại", "Retry")}</button></div>}
        </section>
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"><p>{error}</p><button type="button" onClick={() => setReloadKey((current) => current + 1)} className="mt-3 rounded-lg border border-red-300/30 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-400/10">{translate(language, "Thử lại", "Retry")}</button></div>}
        {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-sky-400" /></div> : <section className="mt-6"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{translate(language, "Bài viết", "Posts")}</h2>{own && <span className="text-xs text-slate-500">{translate(language, "Bạn có thể sửa hoặc xoá bài viết của mình.", "You can edit or delete your own posts.")}</span>}</div>{postError && <div role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"><p>{postError}</p>{failedPostMutation && <button type="button" onClick={() => void retryPostMutation()} disabled={postMutationId !== null} className="mt-2 text-xs font-semibold text-red-100 underline underline-offset-2 disabled:opacity-60">{translate(language, "Thử lại", "Retry")}</button>}</div>}<div className="mt-3 space-y-3">{posts.length ? posts.map((post) => { const editing = editingPostId === post.id; const saving = postMutationId === post.id; return <article key={post.id} className="surface p-5"><div className="flex items-start justify-between gap-3">{editing ? <textarea value={draftContent} onChange={(event) => setDraftContent(event.target.value)} rows={4} className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm leading-6 text-slate-200 outline-none ring-sky-400/40 focus:ring-2" /> : <div className="min-w-0"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.content}</p><Link href={`/posts/${post.id}`} className="mt-3 inline-flex text-xs text-sky-300 hover:text-sky-200">{translate(language, "Xem thảo luận", "View discussion")} →</Link></div>}{own && <div className="flex shrink-0 gap-1">{editing ? <><button type="button" aria-label={translate(language, "Lưu bài viết", "Save post")} title={translate(language, "Lưu bài viết", "Save post")} onClick={() => void savePost(post)} disabled={saving} className="rounded-lg p-2 text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}</button><button type="button" aria-label={translate(language, "Huỷ chỉnh sửa", "Cancel editing")} title={translate(language, "Huỷ chỉnh sửa", "Cancel editing")} onClick={() => { setEditingPostId(null); setDraftContent(""); }} disabled={saving} className="rounded-lg p-2 text-slate-400 hover:bg-slate-700/60"><X className="h-4 w-4" /></button></> : <><button type="button" aria-label={translate(language, "Sửa bài viết", "Edit post")} title={translate(language, "Sửa bài viết", "Edit post")} onClick={() => startEditing(post)} disabled={saving} className="rounded-lg p-2 text-sky-300 hover:bg-sky-400/10 disabled:opacity-50"><Pencil className="h-4 w-4" /></button><button type="button" aria-label={translate(language, "Xoá bài viết", "Delete post")} title={translate(language, "Xoá bài viết", "Delete post")} onClick={() => void removePost(post)} disabled={saving} className="rounded-lg p-2 text-red-300 hover:bg-red-400/10 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></>}</div>}</div></article>; }) : <div className="surface p-8 text-center text-sm text-slate-400">{translate(language, "Chưa có bài viết công khai.", "No public posts yet.")}</div>}</div>{hasMorePosts && <div className="mt-5 text-center"><button type="button" onClick={() => void loadMorePosts()} disabled={loadingMorePosts} className="inline-flex items-center gap-2 rounded-lg border border-sky-400/30 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-400/10 disabled:opacity-60">{loadingMorePosts && <Loader2 className="h-4 w-4 animate-spin" />}{translate(language, "Xem thêm bài viết", "Load more posts")}</button></div>}{loadMoreError && <div role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"><p>{loadMoreError}</p><button type="button" onClick={() => void loadMorePosts()} disabled={loadingMorePosts} className="mt-2 text-xs font-semibold text-red-100 underline underline-offset-2">{translate(language, "Thử lại", "Retry")}</button></div>}</section>}
      </div>
    </main>
  );
}
