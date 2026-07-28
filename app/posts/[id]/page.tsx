"use client";

import { useEffect, useState, use } from "react";
import { getPostById, getPosts } from "@/lib/api";
import { Post } from "@/lib/types";
import { formatDate, extractImageUrl, getErrorMessage, getSourceName } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import Image from "next/image";
import { Share2, Clock, ExternalLink, Flag, Heart, Loader2, MessageCircle, UserRound } from "lucide-react";
import CryptoRanking from "@/components/CryptoRanking";
import MarketWidgets from "@/components/MarketWidgets";
import RelatedNews from "@/components/RelatedNews";
import rehypeRaw from "rehype-raw";
import { translate, useLanguage } from "@/context/LanguageContext";
import { apiClient } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

export default function PostDetail({ params }: { params: Promise<{ id: string }> }) {
    const { language } = useLanguage();
    const { id } = use(params);
    const [post, setPost] = useState<Post | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [reporting, setReporting] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSuccess, setReportSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [postData, allPostsResponse] = await Promise.all([
                    getPostById(id),
                    getPosts({ limit: 10 })
                ]);

                setPost(postData);

                // Filter out current post from related list
                const related = allPostsResponse.posts.filter(p => p.id !== id);

                // DEMO Logic: Fake ID generation removed to prevent 404s
                // If we need more posts, we should handle that in the UI or fetch more from API

                setRelatedPosts(related);

            } catch (err) {
                console.error("Failed to load post data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    if (!post) return <div className="text-white text-center py-20 min-h-screen bg-[#050505]">{translate(language, "Không tìm thấy bài viết", "Post not found")}</div>;

    async function submitReport() {
        if (!post) return;
        if (reportReason.trim().length < 3) {
            setReportError(translate(language, "Hãy nhập lý do ít nhất 3 ký tự.", "Please enter a reason of at least 3 characters."));
            return;
        }
        setReporting(true); setReportError("");
        try {
            await apiClient.post("/api/v1/news-feed/reports", { target_type: "post", target_id: post.id, reason: reportReason.trim(), details: reportDetails.trim() });
            setReportSuccess(true); setReportOpen(false); setReportReason(""); setReportDetails("");
        } catch (error) {
            setReportError(getErrorMessage(error, translate(language, "Không thể gửi báo cáo lúc này. Hãy thử lại.", "Unable to submit the report right now. Please try again.")));
        } finally { setReporting(false); }
    }

    const imageUrl = extractImageUrl(post.content);
    // Remove image md syntax from content to avoid duplicate images
    const cleanContent = post.content.replace(/!\[.*?\]\(.*?\)/g, "").trim();
    const isCommunityPost = !post.source_url;
    const sourceName = post.source_url ? getSourceName(post.source_url) : translate(language, "Cộng đồng", "Community");
    const postTitle = post.title || translate(language, "Bài viết cộng đồng", "Community post");

    return (
        <main className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-cyan-500/20 selection:text-cyan-200 pb-20">

            {/* Breadcrumb / Nav */}
            <div className="border-b border-white/5 bg-[#050505]">
                <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-2 text-xs text-gray-500">
                    <Link href="/" className="hover:text-white transition-colors">{translate(language, "Trang chủ", "Home")}</Link>
                    <span>/</span>
                    <span className="text-gray-300 truncate max-w-[300px]">{postTitle}</span>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">

                    {/* LEFT COLUMN: Crypto Ranking (3/12) */}
                    <div className="hidden xl:block col-span-3">
                        <div className="sticky top-24">
                            <CryptoRanking />
                        </div>
                    </div>

                    {/* CENTER COLUMN: Main Article (6/12) */}
                    <div className="col-span-1 lg:col-span-8 xl:col-span-6">
                        <article>
                            <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-6">
                                {postTitle}
                            </h1>

                            <div className="flex items-center gap-4 text-xs text-gray-400 mb-8 border-b border-white/5 pb-6">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    {formatDate(post.created_at, language)}
                                </span>
                                <span className="bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20">
                                    {sourceName}
                                </span>
                                {isCommunityPost && post.author && (
                                    <Link href={`/profile/${post.author.id}`} className="inline-flex items-center gap-1.5 text-gray-300 hover:text-cyan-300 transition-colors">
                                        <UserRound className="w-4 h-4" />
                                        {post.author.username || translate(language, "Thành viên CryptoCheck", "CryptoCheck member")}
                                    </Link>
                                )}
                            </div>

                            {/* Featured Image */}
                            {imageUrl && (
                                <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8 border border-white/5 bg-gray-900 group">
                                    <Image
                                        src={imageUrl}
                                        alt={post.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/50 to-transparent"></div>
                                </div>
                            )}

                            {/* Main Content */}
                            <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed prose-headings:text-white prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-img:rounded-xl">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                    {cleanContent}
                                </ReactMarkdown>
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-12 border-t border-white/10 pt-8">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/5 hover:border-white/10">
                                        <Share2 className="w-4 h-4" /> {translate(language, "Chia sẻ bài viết", "Share this article")}
                                    </button>

                                {isCommunityPost && (
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span className="inline-flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-300" />{post.reaction_count || 0}</span>
                                        <span className="inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-cyan-300" />{post.comment_count || 0}</span>
                                    </div>
                                )}

                                    <div className="flex flex-wrap items-center gap-3">
                                        {getAuthToken() ? <button type="button" onClick={() => { setReportOpen((current) => !current); setReportError(""); setReportSuccess(false); }} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-amber-400/30 hover:bg-amber-400/5 hover:text-amber-200"><Flag className="w-4 h-4" />{translate(language, "Báo cáo", "Report")}</button> : <Link href="/login" className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-amber-400/30 hover:text-amber-200"><Flag className="w-4 h-4" />{translate(language, "Đăng nhập để báo cáo", "Sign in to report")}</Link>}
                                        {post.source_url && (
                                            <a
                                                href={post.source_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium border border-cyan-500/20 px-4 py-2 rounded-lg hover:bg-cyan-500/10"
                                            >
                                                {translate(language, "Bài viết gốc", "Original article")} <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                {reportSuccess && <p role="status" className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{translate(language, "Đã gửi báo cáo. Đội ngũ kiểm duyệt sẽ xem xét.", "Your report was submitted. The moderation team will review it.")}</p>}
                                {reportOpen && <section className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4"><h2 className="font-semibold text-amber-100">{translate(language, "Báo cáo nội dung", "Report content")}</h2><p className="mt-1 text-sm text-slate-400">{translate(language, "Chỉ báo cáo nội dung vi phạm. Không dùng tính năng này cho tranh luận đầu tư thông thường.", "Only report content that violates the rules. Do not use this for ordinary investment disagreements.")}</p><label className="mt-4 block text-sm text-slate-300">{translate(language, "Lý do", "Reason")}<input value={reportReason} onChange={(event) => setReportReason(event.target.value)} minLength={3} maxLength={250} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-amber-300" /></label><label className="mt-3 block text-sm text-slate-300">{translate(language, "Chi tiết (không bắt buộc)", "Details (optional)")}<textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={1000} rows={3} className="mt-1.5 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-amber-300" /></label>{reportError && <p role="alert" className="mt-3 text-sm text-red-200">{reportError}</p>}<div className="mt-4 flex gap-2"><button type="button" onClick={() => void submitReport()} disabled={reporting || reportReason.trim().length < 3} className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{reporting && <Loader2 className="h-4 w-4 animate-spin" />}{translate(language, "Gửi báo cáo", "Submit report")}</button><button type="button" onClick={() => setReportOpen(false)} disabled={reporting} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">{translate(language, "Huỷ", "Cancel")}</button></div></section>}
                            </div>
                        </article>
                    </div>

                    {/* RIGHT COLUMN: Related & Calendar (3/12) */}
                    <div className="hidden lg:block col-span-4 xl:col-span-3 space-y-8">
                        {/* Related News */}
                        <RelatedNews posts={relatedPosts} />

                        {/* Widgets Wrapper */}
                        <div className="sticky top-24">
                            <MarketWidgets />
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
