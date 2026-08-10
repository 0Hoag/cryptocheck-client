"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Heart, Loader2, MessageCircle, Send, Share2, Sparkles, UsersRound } from "lucide-react";
import { AuthUser, getAuthUser } from "@/lib/auth";
import { Comment, CommunityPost, Reaction, createComment, createPost, createReaction, deleteReaction, getComments, getCommunityPostsPage, getReactions } from "@/lib/social";
import { getErrorMessage } from "@/lib/utils";
import { translate, useLanguage } from "@/context/LanguageContext";

type CardRetry = "load" | "like" | "comment" | null;

function timeAgo(value: string, language: "vi" | "en") {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return translate(language, "Vừa xong", "Just now");
  if (minutes < 60) return language === "vi" ? `${minutes} phút` : `${minutes}m`;
  if (minutes < 1440) return language === "vi" ? `${Math.floor(minutes / 60)} giờ` : `${Math.floor(minutes / 60)}h`;
  return language === "vi" ? `${Math.floor(minutes / 1440)} ngày` : `${Math.floor(minutes / 1440)}d`;
}

export default function CommunityPage() {
  const { language } = useLanguage();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postPage, setPostPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setLoadMoreError("");
    try {
      const result = await getCommunityPostsPage(undefined, 1, 12);
      setPosts(result.posts);
      setPostPage(result.page);
      setHasMorePosts(result.hasMore);
    } catch (requestError) {
      setError(getErrorMessage(requestError, translate(language, "Không tải được bảng tin cộng đồng. Hãy kiểm tra kết nối rồi thử lại.", "Unable to load the community feed. Check your connection and try again.")));
    } finally {
      setLoading(false);
    }
  }, [language]);

  const loadMore = async () => {
    setLoadingMorePosts(true);
    setLoadMoreError("");
    try {
      const result = await getCommunityPostsPage(undefined, postPage + 1, 12);
      setPosts((current) => {
        const known = new Set(current.map((post) => post.id));
        return [...current, ...result.posts.filter((post) => !known.has(post.id))];
      });
      setPostPage(result.page);
      setHasMorePosts(result.hasMore);
    } catch (requestError) {
      setLoadMoreError(getErrorMessage(requestError, translate(language, "Không thể tải thêm bài viết lúc này.", "Unable to load more posts right now.")));
    } finally {
      setLoadingMorePosts(false);
    }
  };

  useEffect(() => {
    setUser(getAuthUser());
    void load();
  }, [load]);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_300px]">
        <section>
          <div className="mb-6"><div className="eyebrow"><UsersRound className="h-3.5 w-3.5 text-sky-400" />{translate(language, "Cộng đồng", "Community")}</div><h1 className="mt-2 text-3xl font-semibold text-white">{translate(language, "Góc nhìn nhà đầu tư", "Investor perspectives")}</h1><p className="mt-2 text-sm text-slate-400">{translate(language, "Trao đổi về crypto, chứng khoán và các tín hiệu thị trường.", "Discuss crypto, equities and market signals.")}</p></div>
          {user ? <Composer language={language} onCreated={(post) => setPosts((current) => [post, ...current])} /> : <div className="surface mb-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-slate-100">{translate(language, "Bạn có góc nhìn muốn chia sẻ?", "Have an insight to share?")}</p><p className="mt-1 text-sm text-slate-400">{translate(language, "Đăng nhập để đăng bài, thả tim và bình luận.", "Sign in to post, like and comment.")}</p></div><Link href="/login" className="rounded-xl bg-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-slate-950 hover:bg-sky-400">{translate(language, "Đăng nhập", "Sign in")}</Link></div>}
          {error && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"><span>{error}</span><button type="button" onClick={() => void load()} disabled={loading} className="shrink-0 rounded-lg border border-red-300/20 px-3 py-1.5 font-medium hover:bg-red-500/10 disabled:opacity-60">{translate(language, "Thử lại", "Retry")}</button></div>}
          {loading ? <div className="grid place-items-center py-20"><Loader2 className="h-7 w-7 animate-spin text-sky-400" /></div> : posts.length ? <><div className="space-y-4">{posts.map((post) => <CommunityCard key={post.id} language={language} post={post} user={user} />)}</div>{hasMorePosts && <div className="mt-5 text-center"><button type="button" onClick={() => void loadMore()} disabled={loadingMorePosts} className="inline-flex items-center gap-2 rounded-lg border border-sky-400/30 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-400/10 disabled:opacity-60">{loadingMorePosts && <Loader2 className="h-4 w-4 animate-spin" />}{translate(language, "Xem thêm bài viết", "Load more posts")}</button></div>}{loadMoreError && <div role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"><p>{loadMoreError}</p><button type="button" onClick={() => void loadMore()} disabled={loadingMorePosts} className="mt-2 text-xs font-semibold text-red-100 underline underline-offset-2 disabled:opacity-60">{translate(language, "Thử lại", "Retry")}</button></div>}</> : <div className="surface p-10 text-center"><UsersRound className="mx-auto h-8 w-8 text-sky-400" /><p className="mt-4 font-medium text-white">{translate(language, "Chưa có thảo luận nào", "No discussions yet")}</p><p className="mt-2 text-sm text-slate-400">{translate(language, "Hãy mở đầu cuộc trò chuyện đầu tiên của cộng đồng.", "Start the community's first conversation.")}</p></div>}
        </section>
        <aside className="space-y-4"><div className="surface p-5"><div className="eyebrow"><Sparkles className="h-3.5 w-3.5 text-amber-300" />{translate(language, "Quy tắc cộng đồng", "Community rules")}</div><ul className="mt-4 space-y-3 text-sm leading-5 text-slate-400"><li>{translate(language, "Chia sẻ luận điểm, không hô hào FOMO.", "Share a thesis; do not promote FOMO.")}</li><li>{translate(language, "Nêu rõ nguồn khi trích dẫn dữ liệu.", "Cite sources when referencing data.")}</li><li>{translate(language, "Tôn trọng thành viên và quản trị viên.", "Respect members and moderators.")}</li></ul></div><div className="rounded-2xl border border-sky-400/20 bg-sky-500/5 p-5"><p className="text-sm font-semibold text-sky-100">{translate(language, "Cộng đồng Premium", "Premium communities")}</p><p className="mt-2 text-sm leading-6 text-slate-400">{translate(language, "Group riêng và phân tích nâng cao sẽ được mở khi hệ thống gói thành viên hoàn thiện.", "Private groups and enhanced analysis become available with Premium entitlement.")}</p></div></aside>
      </div>
    </main>
  );
}

function Composer({ language, onCreated }: { language: "vi" | "en"; onCreated: (post: CommunityPost) => void }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const publish = async (contentToPublish = content) => {
    const trimmed = contentToPublish.trim();
    if (!trimmed) return;
    setSaving(true); setError("");
    try { onCreated(await createPost(trimmed)); setContent(""); }
    catch (requestError) { setError(getErrorMessage(requestError, translate(language, "Không thể đăng bài lúc này.", "Unable to publish this post right now."))); }
    finally { setSaving(false); }
  };
  return <form onSubmit={(event) => { event.preventDefault(); void publish(); }} className="surface mb-5 p-4"><label htmlFor="community-composer" className="sr-only">{translate(language, "Nội dung bài viết", "Post content")}</label><textarea id="community-composer" value={content} onChange={(event) => setContent(event.target.value)} rows={3} maxLength={3000} placeholder={translate(language, "Bạn đang theo dõi cơ hội hay rủi ro nào?", "What opportunity or risk are you tracking?")} className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-slate-500" />{error && <div role="alert" className="mt-2 flex items-center justify-between gap-3 text-xs text-red-300"><span>{error}</span><button type="button" onClick={() => void publish()} disabled={saving || !content.trim()} className="font-semibold underline underline-offset-2 disabled:opacity-60">{translate(language, "Thử lại", "Retry")}</button></div>}<div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3"><span className="text-xs text-slate-500">{content.length}/3000</span><button disabled={saving || !content.trim()} className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{translate(language, "Đăng bài", "Publish")}</button></div></form>;
}

function CommunityCard({ post, user, language }: { post: CommunityPost; user: AuthUser | null; language: "vi" | "en" }) {
  const [likes, setLikes] = useState(post.reaction_count || 0);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [liking, setLiking] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [retry, setRetry] = useState<CardRetry>(null);
  const [shareStatus, setShareStatus] = useState<"success" | "error" | null>(null);
  const displayName = user?.id === post.author_id ? user.username : post.author?.username || `${translate(language, "Nhà đầu tư", "Investor")} ${post.author_id.slice(-4)}`;

  const loadInteractions = useCallback(async () => {
    setLoadingInteractions(true); setActionError(""); setRetry(null);
    try {
      const [reactionData, commentData] = await Promise.all([getReactions(post.id), getComments(post.id)]);
      setLikes(reactionData.length || post.reaction_count || 0);
      setMyReaction(reactionData.find((item: Reaction) => item.author_id === user?.id)?.id || null);
      setComments(commentData);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, translate(language, "Không tải được tương tác của bài viết này.", "Unable to load this post's interactions."))); setRetry("load");
    } finally { setLoadingInteractions(false); }
  }, [language, post.id, post.reaction_count, user?.id]);

  useEffect(() => { void loadInteractions(); }, [loadInteractions]);

  const like = async () => {
    if (!user) return;
    setLiking(true); setActionError(""); setRetry(null);
    try {
      if (myReaction) { await deleteReaction(myReaction); setMyReaction(null); setLikes((current) => Math.max(0, current - 1)); }
      else { const reaction = await createReaction(post.id); setMyReaction(reaction.id); setLikes((current) => current + 1); }
    } catch (requestError) { setActionError(getErrorMessage(requestError, translate(language, "Không thể cập nhật lượt thích.", "Unable to update the like."))); setRetry("like"); }
    finally { setLiking(false); }
  };

  const addComment = async (contentToSend = comment) => {
    const trimmed = contentToSend.trim();
    if (!trimmed || !user) return;
    setCommenting(true); setActionError(""); setRetry(null);
    try { const created = await createComment(post.id, trimmed); setComments((current) => [...current, created]); setComment(""); }
    catch (requestError) { setActionError(getErrorMessage(requestError, translate(language, "Không thể gửi bình luận.", "Unable to send this comment."))); setRetry("comment"); }
    finally { setCommenting(false); }
  };

  const share = async () => {
    setShareStatus(null);
    const url = `${window.location.origin}/posts/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: translate(language, "Bài viết cộng đồng CryptoCheck", "CryptoCheck community post"), text: post.content.slice(0, 120), url });
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else throw new Error("Sharing unavailable");
      setShareStatus("success");
    } catch (requestError) { if ((requestError as DOMException)?.name !== "AbortError") setShareStatus("error"); }
  };

  const retryAction = () => { if (retry === "load") void loadInteractions(); else if (retry === "like") void like(); else if (retry === "comment") void addComment(); };
  return <article id={post.id} className="surface p-5"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-500/15 font-semibold text-sky-300">{displayName.slice(0, 1).toUpperCase()}</div><div><Link href={`/profile/${post.author_id}`} className="text-sm font-semibold text-slate-100 hover:text-sky-200">{displayName}</Link><p className="mt-0.5 text-xs text-slate-500">{timeAgo(post.created_at, language)} · {translate(language, "Công khai", "Public")}</p></div></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.content}</p>{actionError && <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-200"><span>{actionError}</span>{retry && <button type="button" onClick={retryAction} disabled={loadingInteractions || liking || commenting} className="font-semibold underline underline-offset-2 disabled:opacity-60">{translate(language, "Thử lại", "Retry")}</button>}</div>}<div className="mt-4 flex items-center gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={() => void like()} disabled={liking || !user} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${myReaction ? "bg-rose-500/10 text-rose-300" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"}`}><Heart className={`h-4 w-4 ${myReaction ? "fill-current" : ""}`} />{loadingInteractions ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : likes || translate(language, "Thích", "Like")}</button><button type="button" onClick={() => setOpen((current) => !current)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-900 hover:text-slate-200"><MessageCircle className="h-4 w-4" />{comments.length || translate(language, "Bình luận", "Comment")}</button><button type="button" onClick={() => void share()} className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-900 hover:text-slate-200" aria-label={translate(language, "Chia sẻ bài viết", "Share post")}><Share2 className="h-4 w-4" /></button></div>{shareStatus === "success" && <p role="status" className="mt-2 text-xs text-emerald-200">{translate(language, "Đã mở chia sẻ hoặc sao chép liên kết.", "Share sheet opened or link copied.")}</p>}{shareStatus === "error" && <p role="alert" className="mt-2 text-xs text-red-200">{translate(language, "Không thể chia sẻ lúc này. Hãy sao chép URL trên thanh địa chỉ.", "Unable to share right now. Please copy the URL from the address bar.")}</p>}{open && <div className="mt-4 border-t border-slate-800 pt-4"><div className="space-y-3">{comments.map((item) => <div key={item.id} className="rounded-xl bg-slate-900/70 p-3 text-sm"><Link href={`/profile/${item.author_id}`} className="font-medium text-slate-200 hover:text-sky-200">{translate(language, "Nhà đầu tư", "Investor")} {item.author_id.slice(-4)}</Link><p className="mt-1 whitespace-pre-wrap text-slate-400">{item.content}</p></div>)}</div>{user ? <form onSubmit={(event) => { event.preventDefault(); void addComment(); }} className="mt-3 flex gap-2"><label htmlFor={`comment-${post.id}`} className="sr-only">{translate(language, "Viết bình luận", "Write a comment")}</label><input id={`comment-${post.id}`} value={comment} onChange={(event) => setComment(event.target.value)} maxLength={3000} placeholder={translate(language, "Viết bình luận...", "Write a comment...")} className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-sky-400" /><button disabled={commenting || !comment.trim()} className="rounded-lg bg-sky-500 px-3 text-slate-950 disabled:opacity-50">{commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></form> : <p className="mt-3 text-sm text-slate-500">{translate(language, "Đăng nhập để tham gia thảo luận.", "Sign in to join the discussion.")}</p>}</div>}</article>;
}
