"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, Pencil, Trash2, UserCheck, UserPlus, UserRound, X } from "lucide-react";
import { AuthUser, getAuthUser } from "@/lib/auth";
import { CommunityPost, Follow, createFollow, deleteCommunityPost, deleteFollow, getCommunityPosts, getFollowCounts, getFollows, updateCommunityPost } from "@/lib/social";

function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [viewer, setViewer] = useState<AuthUser | null>(null);
  const [follow, setFollow] = useState<Follow | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");
  const [followError, setFollowError] = useState("");
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [postMutationId, setPostMutationId] = useState<string | null>(null);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    const session = getAuthUser();
    let cancelled = false;
    setViewer(session);
    setLoading(true);
    setError("");
    setFollow(null);

    Promise.all([
      getCommunityPosts(id),
      session && session.id !== id ? getFollows(session.id, id) : Promise.resolve([]),
      getFollowCounts(id),
    ])
      .then(([profilePosts, follows, followCounts]) => {
        if (cancelled) return;
        setPosts(profilePosts);
        setFollow(follows[0] || null);
        setCounts(followCounts);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được hồ sơ hoặc bài viết của thành viên này.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  const own = viewer?.id === id;
  const name = own ? viewer.username : `Nhà đầu tư ${id.slice(-4)}`;

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
      setFollowError(getErrorMessage(requestError, "Không thể cập nhật trạng thái theo dõi lúc này."));
    } finally {
      setFollowLoading(false);
    }
  }

  function startEditing(post: CommunityPost) {
    setPostError("");
    setDraftContent(post.content);
    setEditingPostId(post.id);
  }

  async function savePost(post: CommunityPost) {
    const content = draftContent.trim();
    if (!content) {
      setPostError("Nội dung bài viết không được để trống.");
      return;
    }
    setPostMutationId(post.id);
    setPostError("");
    try {
      await updateCommunityPost(post.id, content);
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, content } : item));
      setEditingPostId(null);
      setDraftContent("");
    } catch (requestError) {
      setPostError(getErrorMessage(requestError, "Không thể cập nhật bài viết lúc này."));
    } finally {
      setPostMutationId(null);
    }
  }

  async function removePost(post: CommunityPost) {
    if (!window.confirm("Xoá bài viết này? Thao tác này không thể hoàn tác.")) return;
    setPostMutationId(post.id);
    setPostError("");
    try {
      await deleteCommunityPost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      if (editingPostId === post.id) {
        setEditingPostId(null);
        setDraftContent("");
      }
    } catch (requestError) {
      setPostError(getErrorMessage(requestError, "Không thể xoá bài viết lúc này."));
    } finally {
      setPostMutationId(null);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/community" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />Cộng đồng</Link>
        <section className="surface mt-5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-sky-500/15 text-sky-300"><UserRound className="h-7 w-7" /></div>
              <div><h1 className="text-xl font-semibold text-white">{name}</h1><p className="mt-1 text-sm text-slate-400">{own ? "Hồ sơ và bài viết của bạn" : "Thành viên CryptoCheck"}</p><div className="mt-2 flex gap-4 text-xs text-slate-400"><span><strong className="text-slate-200">{counts.followers}</strong> người theo dõi</span><span><strong className="text-slate-200">{counts.following}</strong> đang theo dõi</span></div></div>
            </div>
            {!own && (viewer ? <button type="button" onClick={toggleFollow} disabled={followLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60">{followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : follow ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}{follow ? "Đang theo dõi" : "Theo dõi"}</button> : <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"><UserPlus className="h-4 w-4" />Đăng nhập để theo dõi</Link>)}
          </div>
          {followError && <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{followError}</p>}
        </section>
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
        {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-sky-400" /></div> : <section className="mt-6"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Bài viết</h2>{own && <span className="text-xs text-slate-500">Bạn có thể sửa hoặc xoá bài viết của mình.</span>}</div>{postError && <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{postError}</p>}<div className="mt-3 space-y-3">{posts.length ? posts.map((post) => { const editing = editingPostId === post.id; const saving = postMutationId === post.id; return <article key={post.id} className="surface p-5"><div className="flex items-start justify-between gap-3">{editing ? <textarea value={draftContent} onChange={(event) => setDraftContent(event.target.value)} rows={4} className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm leading-6 text-slate-200 outline-none ring-sky-400/40 focus:ring-2" /> : <div className="min-w-0"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.content}</p><Link href={`/posts/${post.id}`} className="mt-3 inline-flex text-xs text-sky-300 hover:text-sky-200">Xem thảo luận →</Link></div>}{own && <div className="flex shrink-0 gap-1">{editing ? <><button type="button" aria-label="Lưu bài viết" title="Lưu bài viết" onClick={() => savePost(post)} disabled={saving} className="rounded-lg p-2 text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}</button><button type="button" aria-label="Huỷ chỉnh sửa" title="Huỷ chỉnh sửa" onClick={() => { setEditingPostId(null); setDraftContent(""); }} disabled={saving} className="rounded-lg p-2 text-slate-400 hover:bg-slate-700/60"><X className="h-4 w-4" /></button></> : <><button type="button" aria-label="Sửa bài viết" title="Sửa bài viết" onClick={() => startEditing(post)} disabled={saving} className="rounded-lg p-2 text-sky-300 hover:bg-sky-400/10 disabled:opacity-50"><Pencil className="h-4 w-4" /></button><button type="button" aria-label="Xoá bài viết" title="Xoá bài viết" onClick={() => removePost(post)} disabled={saving} className="rounded-lg p-2 text-red-300 hover:bg-red-400/10 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></>}</div>}</div></article>; }) : <div className="surface p-8 text-center text-sm text-slate-400">Chưa có bài viết công khai.</div>}</div></section>}
      </div>
    </main>
  );
}
