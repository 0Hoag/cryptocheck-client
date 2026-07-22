"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, Loader2, UserRound } from "lucide-react";
import { AuthUser, getAuthUser } from "@/lib/auth";
import { CommunityPost, getCommunityPosts } from "@/lib/social";

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [viewer, setViewer] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { setViewer(getAuthUser()); getCommunityPosts(id).then(setPosts).catch(() => setError("Không tải được bài viết của thành viên này.")).finally(() => setLoading(false)); }, [id]);
  const own = viewer?.id === id;
  const name = own ? viewer.username : `Nhà đầu tư ${id.slice(-4)}`;
  return <main className="min-h-screen px-4 py-8 sm:px-6"><div className="mx-auto max-w-3xl"><Link href="/community" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />Cộng đồng</Link><section className="surface mt-5 p-6"><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-full bg-sky-500/15 text-sky-300"><UserRound className="h-7 w-7" /></div><div><h1 className="text-xl font-semibold text-white">{name}</h1><p className="mt-1 text-sm text-slate-400">{own ? "Hồ sơ và bài viết của bạn" : "Thành viên CryptoCheck"}</p></div></div></section>{error && <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}{loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-sky-400" /></div> : <section className="mt-6"><h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Bài viết</h2><div className="mt-3 space-y-3">{posts.length ? posts.map((post) => <article key={post.id} className="surface p-5"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.content}</p></article>) : <div className="surface p-8 text-center text-sm text-slate-400">Chưa có bài viết công khai.</div>}</div></section>}</div></main>;
}
