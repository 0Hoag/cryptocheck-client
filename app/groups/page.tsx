"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Crown, Loader2, Lock, Plus, UsersRound } from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { CommunityGroup, CreateGroupInput, createGroup, getGroups } from "@/lib/groups";
import { getErrorMessage } from "@/lib/utils";
import { translate, useLanguage } from "@/context/LanguageContext";

const initialForm: CreateGroupInput = { name: "", slug: "", description: "", avatar_url: "", visibility: "public", join_policy: "open" };
type ScannerQuota = { plan: "free" | "premium"; unlimited: boolean };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export default function GroupsPage() {
  const { language } = useLanguage();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [entitlement, setEntitlement] = useState<"loading" | "premium" | "free" | "unknown">("unknown");

  async function load() {
    setLoading(true);
    setError("");
    try { setGroups(await getGroups()); }
    catch (requestError) { setError(getErrorMessage(requestError, translate(language, "Không tải được danh sách group. Vui lòng thử lại.", "Unable to load groups. Please try again."))); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!getAuthToken()) { setEntitlement("unknown"); return; }
    let active = true;
    setEntitlement("loading");
    void apiClient.get<{ data: ScannerQuota }>("/api/v1/news-feed/scanner/quota")
      .then((response) => { if (active) setEntitlement(response.data.data.unlimited ? "premium" : "free"); })
      .catch(() => { if (active) setEntitlement("unknown"); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true); setError("");
    try {
      const group = await createGroup(form);
      setGroups((current) => [group, ...current]);
      setForm(initialForm); setShowCreate(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError, translate(language, "Không thể tạo group lúc này.", "Unable to create this group right now.")));
    } finally { setCreating(false); }
  }

  const signedIn = Boolean(getAuthToken());
  return <main className="min-h-[calc(100vh-12rem)] px-4 py-8 sm:px-6 lg:py-12"><section className="mx-auto max-w-5xl">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="eyebrow"><UsersRound className="h-4 w-4 text-sky-400" />{translate(language, "Cộng đồng theo chủ đề", "Topic communities")}</div><h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{translate(language, "Group nhà đầu tư", "Investor groups")}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{translate(language, "Thảo luận tập trung theo chủ đề, cùng quy tắc thành viên và luồng bài viết riêng.", "Focused discussion spaces with member rules and their own post feeds.")}</p></div>
      {signedIn ? <button type="button" onClick={() => setShowCreate((current) => !current)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"><Plus className="h-4 w-4" />{translate(language, "Tạo group", "Create group")}</button> : <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400">{translate(language, "Đăng nhập để tạo group", "Sign in to create a group")}</Link>}</div>

    {showCreate && <form onSubmit={submit} className="surface mt-6 grid gap-4 p-5 sm:grid-cols-2"><div className="sm:col-span-2"><div className="eyebrow"><Crown className="h-4 w-4 text-amber-300" />{translate(language, "Tạo không gian thảo luận", "Create a discussion space")}</div><p className="mt-2 text-sm text-slate-400">{translate(language, "Group public mở cho mọi người. Group private cần quyền Premium và sẽ luôn được API kiểm tra lại.", "Public groups are open to everyone. Private groups require Premium and are always verified again by the API.")}</p></div><label className="text-sm text-slate-300">{translate(language, "Tên group", "Group name")}<input required minLength={2} maxLength={80} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-400" /></label><label className="text-sm text-slate-300">Slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={80} value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-400" /></label><label className="text-sm text-slate-300 sm:col-span-2">{translate(language, "Mô tả", "Description")}<textarea maxLength={1000} rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-400" /></label><label className="text-sm text-slate-300">{translate(language, "Quyền riêng tư", "Visibility")}<select value={form.visibility} onChange={(event) => { const visibility = event.target.value as "public" | "private"; if (visibility === "private" && entitlement === "free") { setError(translate(language, "Group riêng tư cần Premium. API cũng sẽ kiểm tra lại khi tạo group.", "Private groups require Premium. The API will verify this again when creating the group.")); return; } setForm((current) => ({ ...current, visibility })); }} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-400"><option value="public">{translate(language, "Công khai", "Public")}</option><option value="private">{translate(language, "Riêng tư (Premium)", "Private (Premium)")}</option></select>{entitlement === "loading" ? <span className="mt-1 block text-xs text-slate-500">{translate(language, "Đang kiểm tra quyền Premium…", "Checking Premium entitlement…")}</span> : entitlement === "free" ? <span className="mt-1 block text-xs text-amber-200">{translate(language, "Tài khoản Free chỉ tạo được group công khai. ", "Free accounts can create public groups only. ")}<Link href="/account" className="font-semibold text-sky-200 underline underline-offset-2 hover:text-sky-100">{translate(language, "Xem gói tài khoản", "View account plan")}</Link>.</span> : entitlement === "premium" ? <span className="mt-1 block text-xs text-emerald-200">{translate(language, "Premium đang hoạt động: có thể tạo group riêng tư.", "Premium is active: private groups are available.")}</span> : <span className="mt-1 block text-xs text-slate-500">{translate(language, "Quyền tạo group sẽ được API xác minh khi gửi.", "The API will verify your entitlement when you submit.")}</span>}</label><label className="text-sm text-slate-300">{translate(language, "Cách tham gia", "Join policy")}<select value={form.join_policy} onChange={(event) => setForm((current) => ({ ...current, join_policy: event.target.value as "open" | "approval" | "invite" }))} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-400"><option value="open">{translate(language, "Tham gia ngay", "Open")}</option><option value="approval">{translate(language, "Chờ duyệt", "Approval required")}</option><option value="invite">{translate(language, "Chỉ mời", "Invite only")}</option></select></label><div className="flex gap-2 sm:col-span-2"><button disabled={creating} className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">{creating && <Loader2 className="h-4 w-4 animate-spin" />}{translate(language, "Tạo group", "Create group")}</button><button type="button" onClick={() => setShowCreate(false)} disabled={creating} className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800">{translate(language, "Huỷ", "Cancel")}</button></div></form>}

    {error && <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100"><span>{error}</span><button type="button" onClick={() => void load()} className="rounded-lg border border-red-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/10">{translate(language, "Thử lại", "Retry")}</button></div>}
    {loading ? <div className="grid place-items-center py-20"><Loader2 className="h-7 w-7 animate-spin text-sky-400" /></div> : groups.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2">{groups.map((group) => <Link key={group.id} href={`/groups/${group.id}`} className="surface group flex min-h-48 flex-col p-5 transition hover:border-sky-400/45"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3">{group.avatar_url ? <img src={group.avatar_url} alt="" className="h-10 w-10 rounded-xl border border-slate-700 object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-xl border border-sky-400/20 bg-sky-500/10 font-semibold text-sky-200">{group.name.slice(0, 1).toUpperCase()}</span>}<div className="min-w-0"><h2 className="truncate font-semibold text-white">{group.name}</h2><p className="mt-0.5 text-xs text-slate-500">/{group.slug}</p></div></div>{group.visibility === "private" ? <Lock className="h-4 w-4 shrink-0 text-amber-300" /> : <UsersRound className="h-4 w-4 shrink-0 text-sky-300" />}</div><p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">{group.description || translate(language, "Chưa có mô tả cho group này.", "This group has no description yet.")}</p><div className="mt-auto flex items-center justify-between pt-5 text-xs"><span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300">{group.join_policy === "open" ? translate(language, "Mở", "Open") : group.join_policy === "approval" ? translate(language, "Chờ duyệt", "Approval") : translate(language, "Chỉ mời", "Invite only")}</span><span className="inline-flex items-center gap-1 font-semibold text-sky-300 group-hover:text-sky-200">{translate(language, "Xem group", "View group")}<ArrowRight className="h-3.5 w-3.5" /></span></div></Link>)}</div> : <div className="surface mt-7 p-10 text-center"><UsersRound className="mx-auto h-8 w-8 text-sky-400" /><p className="mt-4 font-medium text-white">{translate(language, "Chưa có group công khai", "No public groups yet")}</p><p className="mt-2 text-sm text-slate-400">{translate(language, "Hãy tạo group đầu tiên để bắt đầu một chủ đề thảo luận.", "Create the first group to start a discussion topic.")}</p></div>}
  </section></main>;
}
