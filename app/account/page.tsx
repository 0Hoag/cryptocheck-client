"use client";

import Link from "next/link";
import { KeyRound, LogOut, ScanSearch, UserRound } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import { clearAuth, getAuthUser } from "@/lib/auth";

function AccountContent() {
  const user = getAuthUser();
  if (!user) return null;

  return <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12"><section className="surface mx-auto max-w-3xl p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-full border border-sky-400/25 bg-sky-500/10 text-sky-300"><UserRound className="h-7 w-7" /></div><div><p className="eyebrow">Tài khoản</p><h1 className="mt-1 text-2xl font-semibold text-white">{user.username}</h1><p className="mt-1 text-sm text-slate-400">{user.phone || "Thành viên CryptoCheck"}</p></div></div><button type="button" onClick={clearAuth} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/25 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/10"><LogOut className="h-4 w-4" />Đăng xuất</button></div><div className="mt-8 grid gap-3 sm:grid-cols-2"><Link href={`/profile/${user.id}`} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-sky-400/40 hover:bg-sky-500/5"><UserRound className="h-5 w-5 text-sky-300" /><h2 className="mt-4 font-semibold text-white">Hồ sơ & bài viết</h2><p className="mt-1 text-sm leading-6 text-slate-400">Xem bài viết, lượt theo dõi và quản lý bài đăng của bạn.</p></Link><Link href="/scanner" className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-sky-400/40 hover:bg-sky-500/5"><ScanSearch className="h-5 w-5 text-sky-300" /><h2 className="mt-4 font-semibold text-white">Lịch sử quét</h2><p className="mt-1 text-sm leading-6 text-slate-400">Quay lại scanner để xem và chạy lại các lần kiểm tra đã lưu.</p></Link></div><div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-6 text-amber-100"><div className="flex items-center gap-2 font-medium"><KeyRound className="h-4 w-4" />Bảo mật phiên</div><p className="mt-1 text-amber-100/80">Phiên hiện được lưu cục bộ trong trình duyệt. Đăng xuất khi dùng máy dùng chung.</p></div></section></main>;
}

export default function AccountPage() {
  return <RequireAuth><AccountContent /></RequireAuth>;
}
