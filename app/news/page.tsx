"use client";

import { useCallback, useEffect, useState } from "react";
import { getPosts } from "@/lib/api";
import { FeedSort, Post } from "@/lib/types";
import HeroPost from "@/components/HeroPost";
import QuickHeadlines from "@/components/QuickHeadlines";
import MarketWidgets from "@/components/MarketWidgets";
import ArticleCard from "@/components/ArticleCard";
import { ArrowUpRight, Loader2, Radio, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { translate, useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const { language } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sort, setSort] = useState<FeedSort>("newest");
  const pageSize = 12;

  const loadPage = useCallback(async (nextPage: number, replace = false) => {
    if (replace) setLoading(true); else setLoadingMore(true);
    setError("");
    try {
      const response = await getPosts({ page: nextPage, limit: pageSize, sort });
      setPosts((current) => {
        if (replace) return response.posts;
        const known = new Set(current.map((post) => post.id));
        return [...current, ...response.posts.filter((post) => !known.has(post.id))];
      });
      setPage(response.pagination?.current_page ?? nextPage);
      setHasMore(response.pagination ? response.pagination.current_page < response.pagination.total_pages : response.posts.length === pageSize);
    } catch {
      setError(translate(language, "Không tải được bài viết. Vui lòng thử lại sau.", "Failed to load posts. Please try again later."));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [language, sort]);

  useEffect(() => { void loadPage(1, true); }, [loadPage]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" aria-hidden="true" />
        <span className="sr-only">{translate(language, "Đang tải tin tức", "Loading news")}</span>
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
            <div className="mb-2 flex items-center gap-2 eyebrow"><Radio className="h-3.5 w-3.5 text-emerald-400" /> {translate(language, "Cập nhật liên tục", "Live updates")}</div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{translate(language, "Bức tranh thị trường hôm nay", "Today’s market view")}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{translate(language, "Tin tức được tổng hợp, sắp xếp để đọc nhanh, và phân tích rủi ro token ngay khi cần.", "News is aggregated and organized for faster reading, with token-risk analysis when you need it.")}</p>
          </div>
          <Link href="/scanner" className="group inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-200 transition hover:border-sky-400/50 hover:bg-sky-500/20">
            <ShieldCheck className="h-4 w-4" /> {translate(language, "Quét độ tin cậy token", "Scan token reliability")} <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </section>

        {error && <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><span>{error}</span><button type="button" onClick={() => void loadPage(posts.length ? page + 1 : 1, posts.length === 0)} className="rounded-lg border border-red-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/10">{translate(language, "Thử lại", "Retry")}</button></div>}

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* LEFT COLUMN: Quick Headlines (2/12) - Sticky Sidebar */}
          <div className="hidden xl:block col-span-2">
            {recentHeadlines.length > 0 && <QuickHeadlines posts={recentHeadlines} />}
          </div>

          {/* CENTER COLUMN: Main Content (7/12) */}
          <div className="col-span-1 space-y-8 lg:col-span-8 xl:col-span-7">
            <div className="flex justify-end">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-400" htmlFor="news-sort">
                {translate(language, "Sắp xếp", "Sort")}
                <select
                  id="news-sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as FeedSort)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-200 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
                >
                  <option value="newest">{translate(language, "Mới nhất", "Newest")}</option>
                  <option value="oldest">{translate(language, "Cũ nhất", "Oldest")}</option>
                </select>
              </label>
            </div>
            {/* Top Story Hero */}
            {topStory && <HeroPost post={topStory} />}

            {/* Sub Stories Row */}
            {subStories.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]" /> {translate(language, "Đáng đọc", "Worth reading")}
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
                  {translate(language, "Tin mới nhất", "Latest news")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherNews.map(post => (
                    <ArticleCard key={post.id} post={post} variant="default" />
                  ))}
                </div>
              </div>
            )}
            {!error && posts.length === 0 && <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">{translate(language, "Chưa có bài viết nào để hiển thị. Hãy quay lại sau.", "There are no posts to show yet. Please check back later.")}</div>}
            {hasMore && <div className="flex justify-center border-t border-slate-800 pt-6"><button type="button" disabled={loadingMore} onClick={() => void loadPage(page + 1)} className="inline-flex items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60">{loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}{loadingMore ? translate(language, "Đang tải thêm", "Loading more") : translate(language, "Tải thêm tin", "Load more news")}</button></div>}
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
