"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { apiClient } from "@/lib/api";
import { AuthUser, saveAuth } from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const vi = language === "vi";
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const login = await apiClient.post<{ data: { token: string } }>("/api/v1/news-feed/auth/login", { phone, password });
      const token = login.data.data.token;
      const me = await apiClient.get<{ data: AuthUser }>("/api/v1/news-feed/users/myinfo", { headers: { Authorization: `Bearer ${token}` } });
      saveAuth(token, me.data.data);
      router.replace("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || (vi ? "Không thể đăng nhập. Hãy kiểm tra lại số điện thoại và mật khẩu." : "Unable to sign in. Check your phone number and password."));
    } finally { setLoading(false); }
  }

  return <main className="min-h-[calc(100vh-12rem)] px-4 py-12 sm:py-20"><div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-2xl shadow-sky-950/20 lg:grid-cols-[1fr_0.9fr]">
    <section className="hidden border-r border-slate-800 bg-[radial-gradient(circle_at_25%_25%,rgba(14,165,233,0.18),transparent_45%)] p-12 lg:block"><div className="flex items-center gap-2 text-sky-300"><ShieldCheck className="h-6 w-6" /><span className="font-semibold">CryptoCheck</span></div><h1 className="mt-16 text-4xl font-semibold leading-tight text-white">{vi ? "Đầu tư có dữ liệu. Quyết định có cơ sở." : "Invest with data. Decide with confidence."}</h1><p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">{vi ? "Theo dõi thị trường và lưu các công cụ bảo mật của bạn trong một tài khoản." : "Track the market and keep your security tools in one account."}</p></section>
    <section className="p-6 sm:p-10"><div className="mb-8"><div className="eyebrow">Account access</div><h2 className="mt-2 text-3xl font-semibold text-white">{vi ? "Đăng nhập" : "Welcome back"}</h2><p className="mt-2 text-sm text-slate-400">{vi ? "Tiếp tục với tài khoản CryptoCheck của bạn." : "Continue with your CryptoCheck account."}</p></div><form className="space-y-4" onSubmit={submit}><label className="block text-sm font-medium text-slate-300">{vi ? "Số điện thoại" : "Phone number"}<input required inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901234567" className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-sky-400" /></label><label className="block text-sm font-medium text-slate-300">{vi ? "Mật khẩu" : "Password"}<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-sky-400" /></label>{error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{vi ? "Đăng nhập" : "Sign in"}<ArrowRight className="h-4 w-4" /></>}</button></form><div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-slate-800" /><span className="text-[11px] uppercase tracking-wider text-slate-600">{vi ? "hoặc" : "or"}</span><span className="h-px flex-1 bg-slate-800" /></div><button type="button" disabled title={vi ? "Google đăng nhập sẽ sớm được tích hợp" : "Google sign-in is coming soon"} className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-400"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-slate-800">G</span>{vi ? "Tiếp tục với Google" : "Continue with Google"}<span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-300">{vi ? "Sắp ra mắt" : "Soon"}</span></button><p className="mt-6 text-center text-sm text-slate-400">{vi ? "Chưa có tài khoản?" : "New here?"} <Link href="/register" className="font-semibold text-sky-300 hover:text-sky-200">{vi ? "Đăng ký" : "Create one"}</Link></p></section>
  </div></main>;
}
