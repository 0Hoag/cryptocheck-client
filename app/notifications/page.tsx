"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import { apiClient } from "@/lib/api";
import { formatDate, getErrorMessage } from "@/lib/utils";
import { translate, useLanguage } from "@/context/LanguageContext";

type AppNotification = {
  id: string;
  type: string;
  message: string;
  resource_id?: string;
  read_at?: string;
  created_at: string;
};

function notificationCopy(type: string, fallback: string, language: "vi" | "en") {
  const copy: Record<string, [string, string]> = {
    "group.member_joined": ["Có thành viên mới tham gia group của bạn.", "A new member joined your group."],
    "group.join_requested": ["Có yêu cầu tham gia group đang chờ duyệt.", "A group join request is awaiting approval."],
    "group.post_created": ["Có bài viết mới trong group của bạn.", "A new post was published in your group."],
    "group.membership_approved": ["Yêu cầu tham gia group của bạn đã được duyệt.", "Your group join request was approved."],
    "post.reaction_created": ["Có người đã thả cảm xúc vào bài viết của bạn.", "Someone reacted to your post."],
    "post.comment_created": ["Có người đã bình luận bài viết của bạn.", "Someone commented on your post."],
    "user.followed": ["Bạn có người theo dõi mới.", "You have a new follower."],
  };
  return copy[type]?.[language === "vi" ? 0 : 1] || fallback;
}

function notificationHref(notification: AppNotification) {
  if (!notification.resource_id) return "";
  if (notification.type.startsWith("group.")) return `/groups/${notification.resource_id}`;
  if (notification.type.startsWith("post.")) return `/posts/${notification.resource_id}`;
  return "";
}

function NotificationsContent() {
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get<{ data: AppNotification[] }>("/api/v1/news-feed/notifications");
      setNotifications(response.data.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, translate(language, "Không tải được thông báo.", "Unable to load notifications.")));
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    try {
      await apiClient.post(`/api/v1/news-feed/notifications/${id}/read`);
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
    } catch (requestError) {
      setError(getErrorMessage(requestError, translate(language, "Không thể cập nhật thông báo.", "Unable to update notification.")));
    }
  }

  async function markAllRead() {
    try {
      await apiClient.post("/api/v1/news-feed/notifications/read-all");
      setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
    } catch (requestError) {
      setError(getErrorMessage(requestError, translate(language, "Không thể cập nhật thông báo.", "Unable to update notifications.")));
    }
  }

  useEffect(() => { void loadNotifications(); }, []);
  const hasUnread = notifications.some((item) => !item.read_at);

  return <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
    <section className="surface mx-auto max-w-3xl overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="eyebrow">{translate(language, "Cập nhật dành cho bạn", "Updates for you")}</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{translate(language, "Thông báo", "Notifications")}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{translate(language, "Theo dõi phản hồi cho bài viết và hoạt động trong group của bạn.", "Follow responses to your posts and activity in your groups.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void loadNotifications()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{translate(language, "Làm mới", "Refresh")}</button>
          <button type="button" onClick={() => void markAllRead()} disabled={!hasUnread || loading} className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50"><CheckCheck className="h-4 w-4" />{translate(language, "Đọc tất cả", "Mark all read")}</button>
        </div>
      </div>
      {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-sky-300" /></div> : error ? <div role="alert" className="m-5 rounded-xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-100"><p>{error}</p><button type="button" onClick={() => void loadNotifications()} className="mt-3 font-semibold text-sky-300 hover:text-sky-100">{translate(language, "Thử lại", "Retry")}</button></div> : notifications.length ? <div>{notifications.map((item) => { const href = notificationHref(item); return <a key={item.id} href={href || undefined} onClick={(event) => { if (!item.read_at) void markRead(item.id); if (!href) event.preventDefault(); }} className={`flex gap-4 border-b border-slate-800 p-5 transition hover:bg-slate-900/70 sm:px-7 ${item.read_at ? "" : "bg-sky-500/5"}`}><span className={`mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${item.read_at ? "bg-slate-800 text-slate-400" : "bg-sky-500/15 text-sky-300"}`}><Bell className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm leading-6 text-slate-100">{notificationCopy(item.type, item.message, language)}</span><span className="mt-1 block text-xs text-slate-500">{formatDate(item.created_at, language)}</span></span>{href && <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-500" />}</a>; })}</div> : <div className="grid min-h-64 place-items-center px-6 text-center"><div><Bell className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-4 font-medium text-slate-200">{translate(language, "Chưa có thông báo mới.", "You have no notifications yet.")}</p><p className="mt-2 text-sm text-slate-500">{translate(language, "Khi có phản hồi cho bài viết hoặc group, chúng sẽ xuất hiện ở đây.", "Replies to your posts and group activity will appear here.")}</p></div></div>}
    </section>
  </main>;
}

export default function NotificationsPage() {
  return <RequireAuth><NotificationsContent /></RequireAuth>;
}
