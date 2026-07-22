"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, Loader2, UserCheck, UserPlus, UserRound } from "lucide-react";
import { AuthUser, getAuthUser } from "@/lib/auth";
import { CommunityPost, Follow, createFollow, deleteFollow, getCommunityPosts, getFollows } from "@/lib/social";

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
    ])
      .then(([profilePosts, follows]) => {
        if (cancelled) return;
        setPosts(profilePosts);
        setFollow(follows[0] || null);
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
      } else {
        setFollow(await createFollow(id));
      }
    } catch (requestError) {
      setFollowError(getErrorMessage(requestError, "Không thể cập nhật trạng thái theo dõi lúc này."));
    } finally {
      setFollowLoading(false);
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
              <div><h1 className="text-xl font-semibold text-white">{name}</h1><p className="mt-1 text-sm text-slate-400">{own ? "Hồ sơ và bài viết của bạn" : "Thành viên CryptoCheck"}</p></div>
            </div>
            {!own && (viewer ? <button type="button" onClick={toggleFollow} disabled={followLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60">{followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : follow ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}{follow ? "Đang theo dõi" : "Theo dõi"}</button> : <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"><UserPlus className="h-4 w-4" />Đăng nhập để theo dõi</Link>)}
          </div>
          {followError && <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{followError}</p>}
        </section>
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
        {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-sky-400" /></div> : <section className="mt-6"><h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Bài viết</h2><div className="mt-3 space-y-3">{posts.length ? posts.map((post) => <article key={post.id} className="surface p-5"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.content}</p></article>) : <div className="surface p-8 text-center text-sm text-slate-400">Chưa có bài viết công khai.</div>}</div></section>}
      </div>
    </main>
  );
}
