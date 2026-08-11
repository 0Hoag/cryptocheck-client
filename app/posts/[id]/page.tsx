"use client";

import { useCallback, useEffect, useState, use } from "react";
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
import rehypeSanitize from "rehype-sanitize";
import { translate, useLanguage } from "@/context/LanguageContext";
import { apiClient } from "@/lib/api";
import { type AuthUser, getAuthToken, getAuthUser } from "@/lib/auth";
import { shareLink } from "@/lib/share";
import { type Comment, type Reaction, createComment, createReaction, deleteReaction, getComments, getReactions } from "@/lib/social";

export default function PostDetail({ params }: { params: Promise<{ id: string }> }) {
    const { language } = useLanguage();
    const { id } = use(params);
    const [post, setPost] = useState<Post | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [reportOpen, setReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [reporting, setReporting] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSuccess, setReportSuccess] = useState(false);
    const [shareStatus, setShareStatus] = useState<"" | "success" | "error">("");
    const [user, setUser] = useState<AuthUser | null>(null);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [myReaction, setMyReaction] = useState<string | null>(null);
    const [interactionsLoaded, setInteractionsLoaded] = useState(false);
    const [interactionsLoading, setInteractionsLoading] = useState(false);
    const [interactionError, setInteractionError] = useState("");
    const [interactionRetry, setInteractionRetry] = useState<"load" | "like" | "comment" | null>(null);
    const [liking, setLiking] = useState(false);
    const [comment, setComment] = useState("");
    const [commenting, setCommenting] = useState(false);
    const isCommunityPost = Boolean(post && !post.source_url);

    useEffect(() => {
        const syncSession = () => setUser(getAuthUser());
        syncSession();
        window.addEventListener("cryptocheck-auth-change", syncSession);
        return () => window.removeEventListener("cryptocheck-auth-change", syncSession);
    }, []);

    const loadPost = useCallback(async () => {
        setLoading(true);
        setLoadError("");
        try {
            const [postData, allPostsResponse] = await Promise.all([
                getPostById(id),
                getPosts({ limit: 10 })
            ]);
            setPost(postData);
            setRelatedPosts(allPostsResponse.posts.filter((item) => item.id !== id));
        } catch (error) {
            setPost(null);
            setRelatedPosts([]);
            setLoadError(getErrorMessage(error, translate(language, "Không thể tải bài viết lúc này. Hãy thử lại.", "Unable to load this post right now. Please try again.")));
        } finally {
            setLoading(false);
        }
    }, [id, language]);

    useEffect(() => {
        void loadPost();
    }, [loadPost]);

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

    async function sharePost() {
        const url = window.location.href;
        setShareStatus("");
        const result = await shareLink({ title: postTitle, text: postTitle, url });
        if (result === "shared") setShareStatus("success");
        else if (result === "unavailable") setShareStatus("error");
    }

    const loadInteractions = useCallback(async (): Promise<string | null | undefined> => {
        if (!post || !isCommunityPost) return null;
        setInteractionsLoading(true); setInteractionError(""); setInteractionRetry(null);
        try {
            const [reactionData, commentData] = await Promise.all([getReactions(post.id), getComments(post.id)]);
            setMyReaction(reactionData.find((item: Reaction) => item.author_id === user?.id)?.id || null);
            setComments(commentData);
            setInteractionsLoaded(true);
            return reactionData.find((item: Reaction) => item.author_id === user?.id)?.id || null;
        } catch (error) {
            setInteractionError(getErrorMessage(error, translate(language, "Không thể tải tương tác của bài viết này.", "Unable to load this post's interactions.")));
            setInteractionRetry("load");
            return undefined;
        } finally { setInteractionsLoading(false); }
    }, [isCommunityPost, language, post, user?.id]);

    const updatePostCount = (field: "reaction_count" | "comment_count", change: number) => {
        setPost((current) => current ? { ...current, [field]: Math.max(0, (current[field] || 0) + change) } : current);
    };

    const toggleLike = async () => {
        if (!post || !user) return;
        setLiking(true); setInteractionError(""); setInteractionRetry(null);
        let priorReaction = myReaction;
        if (!interactionsLoaded) {
            const loadedReaction = await loadInteractions();
            if (loadedReaction === undefined) { setLiking(false); return; }
            priorReaction = loadedReaction;
        }
        try {
            if (priorReaction) {
                setMyReaction(null); updatePostCount("reaction_count", -1);
                await deleteReaction(priorReaction);
            } else {
                setMyReaction(`pending-like-${post.id}`); updatePostCount("reaction_count", 1);
                const created = await createReaction(post.id); setMyReaction(created.id);
            }
        } catch (error) {
            setMyReaction(priorReaction); updatePostCount("reaction_count", priorReaction ? 1 : -1);
            setInteractionError(getErrorMessage(error, translate(language, "Không thể cập nhật lượt thích.", "Unable to update the like.")));
            setInteractionRetry("like");
        } finally { setLiking(false); }
    };

    const addComment = async (contentToSend = comment) => {
        const trimmed = contentToSend.trim();
        if (!post || !user || !trimmed || interactionsLoading) return;
        setCommenting(true); setInteractionError(""); setInteractionRetry(null);
        const optimisticId = `pending-comment-${Date.now()}`;
        const optimisticComment: Comment = { id: optimisticId, post_id: post.id, author_id: user.id, content: trimmed, created_at: new Date().toISOString() };
        setComments((current) => [...current, optimisticComment]); setComment(""); updatePostCount("comment_count", 1);
        try {
            const created = await createComment(post.id, trimmed);
            setComments((current) => current.map((item) => item.id === optimisticId ? created : item));
        } catch (error) {
            setComments((current) => current.filter((item) => item.id !== optimisticId)); setComment(contentToSend); updatePostCount("comment_count", -1);
            setInteractionError(getErrorMessage(error, translate(language, "Không thể gửi bình luận.", "Unable to send this comment.")));
            setInteractionRetry("comment");
        } finally { setCommenting(false); }
    };

    const retryInteraction = () => {
        if (interactionRetry === "load") void loadInteractions();
        else if (interactionRetry === "like") void toggleLike();
        else if (interactionRetry === "comment") void addComment();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center" role="status">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" aria-hidden="true" />
                <span className="sr-only">{translate(language, "Đang tải bài viết", "Loading post")}</span>
            </div>
        );
    }

    if (!post) return <main className="min-h-screen bg-[#050505] px-4 py-20 text-center text-white"><p role={loadError ? "alert" : undefined}>{loadError || translate(language, "Không tìm thấy bài viết", "Post not found")}</p>{loadError && <button type="button" onClick={() => void loadPost()} className="mt-5 rounded-lg border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/10">{translate(language, "Thử lại", "Retry")}</button>}</main>;

    const postTitle = post.title || translate(language, "Bài viết cộng đồng", "Community post");
    const sourceName = post.source_url ? getSourceName(post.source_url) : translate(language, "Cộng đồng", "Community");
    const imageUrl = extractImageUrl(post.content);
    const cleanContent = post.content.replace(/!\[.*?\]\(.*?\)/g, "").trim();

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
                                        sizes="(max-width: 1023px) 100vw, (max-width: 1279px) 66vw, 50vw"
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/50 to-transparent"></div>
                                </div>
                            )}

                            {!isCommunityPost && (
                                <aside role="note" className="mb-6 rounded-xl border border-sky-400/20 bg-sky-400/5 px-4 py-3 text-sm leading-6 text-slate-300">
                                    {translate(
                                        language,
                                        "CryptoCheck hiển thị bản tóm tắt/dịch tự động từ nội dung công khai mà nguồn cung cấp. Đây không phải bản sao toàn văn; hãy mở bài gốc để đọc đầy đủ và kiểm tra ngữ cảnh.",
                                        "CryptoCheck shows an automated translated summary from public content supplied by the source. It is not a full-text copy; open the original article for the complete context."
                                    )}
                                </aside>
                            )}

                            {/* Main Content */}
                            <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed prose-headings:text-white prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-img:rounded-xl">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                                    {cleanContent}
                                </ReactMarkdown>
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-12 border-t border-white/10 pt-8">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <button type="button" onClick={() => void sharePost()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/5 hover:border-white/10">
                                        <Share2 className="w-4 h-4" /> {translate(language, "Chia sẻ bài viết", "Share this article")}
                                    </button>

                                    {isCommunityPost && (
                                        <div className="flex flex-wrap items-center gap-2 text-sm">
                                            {user ? <button type="button" onClick={() => void toggleLike()} disabled={interactionsLoading || liking} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors disabled:opacity-50 ${myReaction ? "bg-rose-500/10 text-rose-200" : "bg-white/5 text-gray-300 hover:bg-rose-500/10 hover:text-rose-200"}`}><Heart className={`w-4 h-4 ${myReaction ? "fill-current" : ""}`} />{post.reaction_count || translate(language, "Thích", "Like")}</button> : <Link href="/login" className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-gray-300 hover:bg-white/10"><Heart className="w-4 h-4" />{post.reaction_count || translate(language, "Thích", "Like")}</Link>}
                                            <button type="button" onClick={() => { const shouldOpen = !commentsOpen; setCommentsOpen(shouldOpen); if (shouldOpen && !interactionsLoaded) void loadInteractions(); }} className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-gray-300 hover:bg-white/10"><MessageCircle className="w-4 h-4 text-cyan-300" />{post.comment_count || translate(language, "Bình luận", "Comment")}</button>
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
                                {reportSuccess && <p role="status" className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{translate(language, "Đã gửi báo cáo. Đội ngũ kiểm duyệt sẽ xem xét.", "Your report was submitted. The moderation team will review it.")} <Link href="/reports" className="font-semibold text-sky-200 underline underline-offset-2 hover:text-sky-100">{translate(language, "Xem trạng thái", "View status")}</Link></p>}
                                {shareStatus === "success" && <p role="status" className="mt-4 text-sm text-emerald-200">{translate(language, "Đã mở trình chia sẻ hoặc sao chép liên kết bài viết.", "The share sheet was opened or the article link was copied.")}</p>}
                                {shareStatus === "error" && <p role="alert" className="mt-4 text-sm text-red-200">{translate(language, "Không thể chia sẻ liên kết lúc này. Hãy sao chép URL trên thanh địa chỉ.", "Unable to share the link right now. Please copy the URL from the address bar.")}</p>}
                                {isCommunityPost && commentsOpen && <section className="mt-5 border-t border-white/10 pt-5">
                                    <h2 className="text-base font-semibold text-white">{translate(language, "Thảo luận", "Discussion")}</h2>
                                    {interactionError && <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100"><span>{interactionError}</span>{interactionRetry && <button type="button" onClick={retryInteraction} disabled={interactionsLoading || liking || commenting} className="font-semibold text-sky-200 underline underline-offset-2 disabled:opacity-50">{translate(language, "Thử lại", "Retry")}</button>}</div>}
                                    <div className="mt-4 space-y-3">{interactionsLoading ? <div role="status" className="grid place-items-center py-4"><Loader2 className="h-5 w-5 animate-spin text-sky-300" aria-hidden="true" /><span className="sr-only">{translate(language, "Đang tải bình luận", "Loading comments")}</span></div> : comments.length ? comments.map((item) => <div key={item.id} className={`rounded-xl bg-white/5 p-3 text-sm ${item.id.startsWith("pending-comment-") ? "opacity-60" : ""}`}><p className="font-medium text-slate-200">{item.author_id === user?.id ? user.username : `${translate(language, "Nhà đầu tư", "Investor")} ${item.author_id.slice(-4)}`}</p><p className="mt-1 whitespace-pre-wrap leading-6 text-slate-400">{item.content}</p></div>) : <p className="py-3 text-sm text-slate-500">{translate(language, "Chưa có bình luận nào.", "No comments yet.")}</p>}</div>
                                    {user ? <form onSubmit={(event) => { event.preventDefault(); void addComment(); }} className="mt-4 flex gap-2"><label htmlFor="post-detail-comment" className="sr-only">{translate(language, "Viết bình luận", "Write a comment")}</label><input id="post-detail-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={3000} placeholder={translate(language, "Viết bình luận...", "Write a comment...")} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-400" /><button disabled={interactionsLoading || commenting || !comment.trim()} className="inline-flex items-center rounded-lg bg-sky-500 px-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{commenting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : translate(language, "Gửi", "Send")}</button></form> : <p className="mt-4 text-sm text-slate-500"><Link href="/login" className="font-medium text-sky-300 hover:text-sky-200">{translate(language, "Đăng nhập", "Sign in")}</Link>{translate(language, " để tham gia thảo luận.", " to join the discussion.")}</p>}
                                </section>}
                                {reportOpen && <section className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                                    <h2 className="font-semibold text-amber-100">{translate(language, "Báo cáo nội dung", "Report content")}</h2>
                                    <p className="mt-1 text-sm text-slate-400">{translate(language, "Chỉ báo cáo nội dung vi phạm. Không dùng tính năng này cho tranh luận đầu tư thông thường.", "Only report content that violates the rules. Do not use this for ordinary investment disagreements.")}</p>
                                    <label className="mt-4 block text-sm text-slate-300">{translate(language, "Lý do", "Reason")}
                                        <input value={reportReason} onChange={(event) => setReportReason(event.target.value)} minLength={3} maxLength={250} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-amber-300" />
                                    </label>
                                    <label className="mt-3 block text-sm text-slate-300">{translate(language, "Chi tiết (không bắt buộc)", "Details (optional)")}
                                        <textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={1000} rows={3} className="mt-1.5 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-amber-300" />
                                    </label>
                                    {reportError && <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100"><p>{reportError}</p><button type="button" onClick={() => void submitReport()} disabled={reporting || reportReason.trim().length < 3} className="font-semibold text-sky-300 hover:text-sky-100 disabled:opacity-50">{translate(language, "Thử lại", "Retry")}</button></div>}
                                    <div className="mt-4 flex gap-2">
                                        <button type="button" onClick={() => void submitReport()} disabled={reporting || reportReason.trim().length < 3} className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{reporting && <Loader2 className="h-4 w-4 animate-spin" />}{translate(language, "Gửi báo cáo", "Submit report")}</button>
                                        <button type="button" onClick={() => setReportOpen(false)} disabled={reporting} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">{translate(language, "Huỷ", "Cancel")}</button>
                                    </div>
                                </section>}
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
