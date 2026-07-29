"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Crown, KeyRound, Loader2, LogOut, RefreshCw, ScanSearch, UserRound } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import { clearAuth, getAuthUser } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { translate, useLanguage } from "@/context/LanguageContext";

type ScannerQuota = { plan: "free" | "premium"; limit: number; used: number; unlimited: boolean };

function AccountContent() {
  const { language } = useLanguage();
  const user = getAuthUser();
  const [quota, setQuota] = useState<ScannerQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [quotaError, setQuotaError] = useState("");

  const loadEntitlement = useCallback(async () => {
    setQuotaLoading(true);
    setQuotaError("");
    try { setQuota((await apiClient.get<{ data: ScannerQuota }>("/api/v1/news-feed/scanner/quota")).data.data); }
    catch (error) {
      setQuota(null);
      setQuotaError(getErrorMessage(error, translate(language, "Không tải được trạng thái gói. Hãy thử lại; API vẫn sẽ kiểm tra quyền khi bạn thực hiện hành động.", "Unable to load plan status. Try again; the API will still verify access when you act.")));
    }
    finally { setQuotaLoading(false); }
  }, [language]);

  useEffect(() => { void loadEntitlement(); }, [loadEntitlement]);
  if (!user) return null;

  return <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12"><section className="surface mx-auto max-w-3xl p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-full border border-sky-400/25 bg-sky-500/10 text-sky-300"><UserRound className="h-7 w-7" /></div><div><p className="eyebrow">{translate(language, "Tài khoản", "Account")}</p><h1 className="mt-1 text-2xl font-semibold text-white">{user.username}</h1><p className="mt-1 text-sm text-slate-400">{user.phone || translate(language, "Thành viên CryptoCheck", "CryptoCheck member")}</p></div></div><button type="button" onClick={clearAuth} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/25 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/10"><LogOut className="h-4 w-4" />{translate(language, "Đăng xuất", "Sign out")}</button></div><div className="mt-8 grid gap-3 sm:grid-cols-2"><Link href={`/profile/${user.id}`} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-sky-400/40 hover:bg-sky-500/5"><UserRound className="h-5 w-5 text-sky-300" /><h2 className="mt-4 font-semibold text-white">{translate(language, "Hồ sơ & bài viết", "Profile & posts")}</h2><p className="mt-1 text-sm leading-6 text-slate-400">{translate(language, "Xem bài viết, lượt theo dõi và quản lý bài đăng của bạn.", "View posts, followers and manage your posts.")}</p></Link><Link href="/scanner" className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-sky-400/40 hover:bg-sky-500/5"><ScanSearch className="h-5 w-5 text-sky-300" /><h2 className="mt-4 font-semibold text-white">{translate(language, "Lịch sử quét", "Scan history")}</h2><p className="mt-1 text-sm leading-6 text-slate-400">{translate(language, "Quay lại scanner để xem và chạy lại các lần kiểm tra đã lưu.", "Return to the scanner to view and rerun saved checks.")}</p></Link></div><section className="mt-5 rounded-xl border border-sky-400/20 bg-sky-500/5 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 font-medium text-sky-100"><Crown className="h-4 w-4 text-amber-300" />{translate(language, "Gói và quyền hiện tại", "Current plan & access")}</div><p className="mt-1 text-sm leading-6 text-slate-400">{translate(language, "Quyền hiển thị bên dưới được lấy từ API; server vẫn là nơi quyết định cuối cùng khi quét hoặc tạo group.", "The access below comes from the API; the server remains the final authority for scans and group creation.")}</p></div><button type="button" onClick={() => void loadEntitlement()} disabled={quotaLoading} className="inline-flex items-center gap-2 rounded-lg border border-sky-300/20 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/10 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${quotaLoading ? "animate-spin" : ""}`} />{translate(language, "Làm mới", "Refresh")}</button></div>{quotaLoading ? <div className="mt-4 flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin text-sky-300" />{translate(language, "Đang kiểm tra quyền…", "Checking entitlement…")}</div> : quota?.unlimited ? <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100"><p className="font-semibold">{translate(language, "Premium đang hoạt động", "Premium is active")}</p><p className="mt-1 text-emerald-100/80">{translate(language, "Quét token không giới hạn và có thể tạo group riêng tư.", "Token scans are unlimited and private groups are available.")}</p></div> : quota ? <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-200"><p className="font-semibold">{translate(language, "Gói Free", "Free plan")}</p><p className="mt-1 text-slate-400">{translate(language, `Đã dùng ${quota.used}/${quota.limit} lượt quét thành công hôm nay. Bạn có thể tạo group công khai.`, `${quota.used}/${quota.limit} successful scans used today. You can create public groups.`)}</p><p className="mt-2 text-xs text-amber-200">{translate(language, "Nâng cấp Premium sẽ được mở khi luồng thanh toán chính thức sẵn sàng.", "Premium upgrades will be available when the payment flow is ready.")}</p></div> : <div role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100"><p>{quotaError || translate(language, "Không tải được trạng thái gói. Hãy thử lại; API vẫn sẽ kiểm tra quyền khi bạn thực hiện hành động.", "Unable to load plan status. Try again; the API will still verify access when you act.")}</p><button type="button" onClick={() => void loadEntitlement()} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200/25 px-3 py-2 text-xs font-semibold text-red-50 hover:bg-red-500/10"><RefreshCw className="h-3.5 w-3.5" />{translate(language, "Thử lại", "Try again")}</button></div>}</section><div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-6 text-amber-100"><div className="flex items-center gap-2 font-medium"><KeyRound className="h-4 w-4" />{translate(language, "Bảo mật phiên", "Session security")}</div><p className="mt-1 text-amber-100/80">{translate(language, "Phiên hiện được lưu cục bộ trong trình duyệt. Đăng xuất khi dùng máy dùng chung.", "The current session is stored locally in this browser. Sign out when using a shared device.")}</p></div></section></main>;
}

export default function AccountPage() {
  return <RequireAuth><AccountContent /></RequireAuth>;
}
