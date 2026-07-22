"use client";

import { useEffect, useState } from "react";
import { getPosts } from "@/lib/api";
import { Post } from "@/lib/types";
import HeroPost from "@/components/HeroPost";
import QuickHeadlines from "@/components/QuickHeadlines";
import MarketWidgets from "@/components/MarketWidgets";
import ArticleCard from "@/components/ArticleCard";
import { ArrowUpRight, Loader2, Radio, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await getPosts();
        let fetchedPosts = response.posts;

        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        setError("Failed to load posts. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    );
  }

  // Data slicing strategy
  const topStory = posts.length > 0 ? posts[0] : null;
  const subStories = posts.length > 1 ? posts.slice(1, 4) : [];
  const otherNews = posts.length > 4 ? posts.slice(4) : [];

  // For Headlines, we use the sliced list. Exclude top story usually.
  const recentHeadlines = posts.length > 1 ? posts.slice(1, 15) : [];

  return (
    <main className="min-h-screen text-slate-200 selection:bg-sky-500/30 selection:text-sky-100">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:py-8">
        <section className="mb-6 flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 eyebrow"><Radio className="h-3.5 w-3.5 text-emerald-400" /> cập nhật liên tục</div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Bức tranh thị trường hôm nay</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Tin tức được tổng hợp, sắp xếp để đọc nhanh, và phân tích rủi ro token ngay khi cần.</p>
          </div>
          <Link href="/scanner" className="group inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-200 transition hover:border-sky-400/50 hover:bg-sky-500/20">
            <ShieldCheck className="h-4 w-4" /> Quét độ tin cậy token <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </section>

        {error && <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* LEFT COLUMN: Quick Headlines (2/12) - Sticky Sidebar */}
          <div className="hidden xl:block col-span-2">
            {recentHeadlines.length > 0 && <QuickHeadlines posts={recentHeadlines} />}
          </div>

          {/* CENTER COLUMN: Main Content (7/12) */}
          <div className="col-span-1 space-y-8 lg:col-span-8 xl:col-span-7">
            {/* Top Story Hero */}
            {topStory && <HeroPost post={topStory} />}

            {/* Sub Stories Row */}
            {subStories.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]" /> Đáng đọc
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {subStories.map(post => (
                    <ArticleCard key={post.id} post={post} variant="compact" />
                  ))}
                </div>
              </div>
            )}

            {/* Other News Grid */}
            {otherNews.length > 0 && (
              <div>
                <h2 className="mb-4 border-t border-slate-800 pt-8 text-sm font-bold uppercase tracking-[0.14em] text-slate-200">
                  Tin mới nhất
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherNews.map(post => (
                    <ArticleCard key={post.id} post={post} variant="default" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Widgets (3/12) - Sticky Sidebar */}
          <div className="hidden lg:col-span-4 lg:block xl:col-span-3">
            <div className="sticky top-24">
              <MarketWidgets />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
