"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, FileWarning, Loader2, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import { apiClient } from "@/lib/api";
import { ContentReport, parseReportsResponse } from "@/lib/reports";
import { formatDate, getErrorMessage } from "@/lib/utils";
import { translate, useLanguage } from "@/context/LanguageContext";

function statusPresentation(status: ContentReport["status"], language: "vi" | "en") {
  if (status === "resolved") return { label: translate(language, "Đã xử lý", "Resolved"), tone: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100", icon: CheckCircle2 };
  if (status === "rejected") return { label: translate(language, "Không chấp nhận", "Not accepted"), tone: "border-red-400/25 bg-red-500/10 text-red-100", icon: XCircle };
  if (status === "reviewed") return { label: translate(language, "Đang xem xét", "Under review"), tone: "border-sky-400/25 bg-sky-500/10 text-sky-100", icon: ShieldAlert };
  return { label: translate(language, "Đã tiếp nhận", "Received"), tone: "border-amber-400/25 bg-amber-500/10 text-amber-100", icon: Clock3 };
}

function ReportsContent() {
  const { language } = useLanguage();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get<unknown>("/api/v1/news-feed/reports/mine");
      setReports(parseReportsResponse(response.data));
    } catch (requestError) {
      setError(getErrorMessage(requestError, translate(language, "Không tải được các báo cáo của bạn.", "Unable to load your reports.")));
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => { void loadReports(); }, [loadReports]);

  return <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
    <section className="surface mx-auto max-w-3xl overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="eyebrow">{translate(language, "An toàn cộng đồng", "Community safety")}</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{translate(language, "Báo cáo của tôi", "My reports")}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{translate(language, "Theo dõi trạng thái các nội dung bạn đã gửi để đội ngũ kiểm duyệt xem xét.", "Track the status of content you submitted for moderation review.")}</p>
        </div>
        <button type="button" onClick={() => void loadReports()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{translate(language, "Làm mới", "Refresh")}</button>
      </div>
      {loading ? <div className="grid min-h-64 place-items-center" role="status"><Loader2 className="h-6 w-6 animate-spin text-sky-300" aria-hidden="true" /><span className="sr-only">{translate(language, "Đang tải báo cáo", "Loading reports")}</span></div> : error ? <div role="alert" className="m-5 rounded-xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-100 sm:m-7"><p>{error}</p><button type="button" onClick={() => void loadReports()} className="mt-3 font-semibold text-sky-300 hover:text-sky-100">{translate(language, "Thử lại", "Retry")}</button></div> : reports.length ? <div className="divide-y divide-slate-800">{reports.map((report) => { const status = statusPresentation(report.status, language); const StatusIcon = status.icon; return <article key={report.id} className="p-5 sm:px-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-100">{report.target_type === "post" ? translate(language, "Bài viết", "Post") : translate(language, "Bình luận", "Comment")}</p><p className="mt-1 text-sm text-slate-400">{report.reason}</p></div><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.tone}`}><StatusIcon className="h-3.5 w-3.5" />{status.label}</span></div>{report.details && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-900/60 p-3 text-sm leading-6 text-slate-300">{report.details}</p>}<div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{translate(language, "Gửi", "Submitted")}: {formatDate(report.created_at, language)}</span>{report.target_type === "post" ? <Link href={`/posts/${report.target_id}`} className="font-semibold text-sky-300 hover:text-sky-100">{translate(language, "Xem nội dung", "View content")}</Link> : <span>{translate(language, "Bình luận được quản lý trong ngữ cảnh bài viết.", "Comments are moderated in their post context.")}</span>}</div></article>; })}</div> : <div className="grid min-h-64 place-items-center px-6 text-center"><div><FileWarning className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-4 font-medium text-slate-200">{translate(language, "Bạn chưa gửi báo cáo nào.", "You have not submitted any reports.")}</p><p className="mt-2 text-sm text-slate-500">{translate(language, "Khi phát hiện nội dung vi phạm, bạn có thể báo cáo từ trang chi tiết bài viết.", "When you find content that violates the rules, report it from the post detail page.")}</p></div></div>}
    </section>
  </main>;
}

export default function ReportsPage() {
  return <RequireAuth><ReportsContent /></RequireAuth>;
}
