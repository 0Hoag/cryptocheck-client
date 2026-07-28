"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Lock, Send, UserPlus, UsersRound } from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { CommunityGroup, GroupPost, createGroupPost, getGroup, getGroupPosts, joinGroup } from "@/lib/groups";
import { getErrorMessage } from "@/lib/utils";
import { translate, useLanguage } from "@/context/LanguageContext";

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { language } = useLanguage();
  const [groupID, setGroupID] = useState("");
  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState("");

  useEffect(() => { void params.then(({ id }) => setGroupID(id)); }, [params]);

  async function load(id = groupID) {
    if (!id) return;
    setLoading(true); setError("");
    try {
      const loadedGroup = await getGroup(id);
      setGroup(loadedGroup);
      setPosts(await getGroupPosts(id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, translate(language, "Không tải được group này. Có thể group riêng tư hoặc không còn tồn tại.", "Unable to load this group. It may be private or no longer exist.")));
      setGroup(null);
    } finally { setLoading(false); }
  }

  useEffect(() => { if (groupID) void load(groupID); }, [groupID]);

  async function join() {
    if (!group) return;
    setJoining(true); setError("");
    try {
      const membership = await joinGroup(group.id);
      setGroup((current) => current ? { ...current, membership } : current);
    } catch (requestError) { setError(getErrorMessage(requestError, translate(language, "Không thể tham gia group lúc này.", "Unable to join this group right now."))); }
    finally { setJoining(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!group || !content.trim()) return;
    setPosting(true); setError("");
    try {
      const post = await createGroupPost(group.id, content.trim());
      setPosts((current) => [post, ...current]); setContent("");
    } catch (requestError) { setError(getErrorMessage(requestError, translate(language, "Không thể đăng bài vào group lúc này.", "Unable to post to this group right now."))); }
    finally { setPosting(false); }
  }

  const signedIn = Boolean(getAuthToken());
  const activeMember = group?.membership?.status === "active";
  return <main className="min-h-[calc(100vh-12rem)] px-4 py-8 sm:px-6 lg:py-12"><section className="mx-auto max-w-4xl"><Link href="/groups" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />{translate(language, "Tất cả group", "All groups")}</Link>
    {error && <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100"><span>{error}</span>{groupID && <button type="button" onClick={() => void load()} className="rounded-lg border border-red-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/10">{translate(language, "Thử lại", "Retry")}</button>}</div>}
    {loading ? <div className="grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-sky-400" /></div> : group && <><section className="surface mt-5 p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 items-start gap-4">{group.avatar_url ? <img src={group.avatar_url} alt="" className="h-14 w-14 rounded-2xl border border-slate-700 object-cover" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-xl font-semibold text-sky-200">{group.name.slice(0, 1).toUpperCase()}</span>}<div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold text-white">{group.name}</h1>{group.visibility === "private" && <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-200"><Lock className="h-3.5 w-3.5" />{translate(language, "Riêng tư", "Private")}</span>}</div><p className="mt-1 text-sm text-slate-500">/{group.slug}</p><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{group.description || translate(language, "Group này chưa có mô tả.", "This group has no description yet.")}</p></div></div>
        {!signedIn ? <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"><UserPlus className="h-4 w-4" />{translate(language, "Đăng nhập để tham gia", "Sign in to join")}</Link> : !group.membership ? <button type="button" onClick={() => void join()} disabled={joining || group.join_policy === "invite"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50">{joining && <Loader2 className="h-4 w-4 animate-spin" />}<UserPlus className="h-4 w-4" />{group.join_policy === "invite" ? translate(language, "Chỉ mời", "Invite only") : group.join_policy === "approval" ? translate(language, "Gửi yêu cầu", "Request to join") : translate(language, "Tham gia group", "Join group")}</button> : <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-200">{activeMember ? translate(language, "Bạn là thành viên", "You are a member") : translate(language, "Đang chờ duyệt", "Awaiting approval")}</span>}</div></section>
      {activeMember && <form onSubmit={submit} className="surface mt-5 p-5"><label className="sr-only" htmlFor="group-post">{translate(language, "Nội dung bài viết", "Post content")}</label><textarea id="group-post" value={content} onChange={(event) => setContent(event.target.value)} maxLength={10000} rows={4} placeholder={translate(language, "Chia sẻ góc nhìn với group…", "Share an insight with the group…")} className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-slate-500" /><div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3"><span className="text-xs text-slate-500">{content.length}/10000</span><button disabled={posting || !content.trim()} className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{translate(language, "Đăng bài", "Publish")}</button></div></form>}
      <section className="mt-6"><div className="eyebrow"><UsersRound className="h-4 w-4 text-sky-400" />{translate(language, "Bài viết trong group", "Group posts")}</div><div className="mt-4 space-y-3">{posts.length ? posts.map((post) => <article key={post.id} className="surface p-5">{post.title && <h2 className="font-semibold text-white">{post.title}</h2>}<p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.content}</p></article>) : <div className="surface p-8 text-center text-sm text-slate-400">{translate(language, "Chưa có bài viết trong group này.", "There are no posts in this group yet.")}</div>}</div></section>
    </>}</section></main>;
}
