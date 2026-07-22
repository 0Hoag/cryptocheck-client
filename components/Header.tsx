"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Globe2, LogIn, LogOut, Menu, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { clearAuth, getAuthUser, AuthUser } from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";

export default function Header() {
    const pathname = usePathname();
    const { language, setLanguage } = useLanguage();
    const [user, setUser] = useState<AuthUser | null>(null);
    useEffect(() => {
        const sync = () => setUser(getAuthUser());
        sync();
        window.addEventListener("cryptocheck-auth-change", sync);
        return () => window.removeEventListener("cryptocheck-auth-change", sync);
    }, []);
    const navigation = [
        { href: "/", label: language === "vi" ? "Trang chủ" : "Home" },
        { href: "/news", label: language === "vi" ? "Tin tức" : "News" },
        { href: "/community", label: language === "vi" ? "Cộng đồng" : "Community" },
        { href: "/analysis", label: language === "vi" ? "Phân tích" : "Analysis" },
        { href: "/scanner", label: language === "vi" ? "Quét token" : "Scan token" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-800/90 bg-slate-950/85 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6">
                <Link href="/" className="group flex items-center gap-2.5" aria-label="CryptoCheck home">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-300 transition group-hover:bg-sky-500/25">
                        <ShieldCheck className="h-5 w-5" />
                    </span>
                    <span className="text-lg font-bold tracking-tight text-slate-50">Crypto<span className="text-sky-400">Check</span></span>
                </Link>

                <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
                    {navigation.map((item) => {
                        const active = pathname === item.href;
                        return <Link key={item.href} href={item.href} className={`rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"}`}>{item.label}</Link>;
                    })}
                </nav>

                    <div className="flex items-center gap-2">
                    <button onClick={() => setLanguage(language === "vi" ? "en" : "vi")} className="hidden h-9 items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-900 sm:flex" aria-label="Đổi ngôn ngữ"><Globe2 className="h-3.5 w-3.5" />{language === "vi" ? "VN" : "EN"}</button>
                    <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 sm:flex"><Activity className="h-3.5 w-3.5" /> Live</div>
                    {user ? <button onClick={() => clearAuth()} className="hidden items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-900 sm:flex"><UserRound className="h-4 w-4 text-sky-400" />{user.username}<LogOut className="h-3.5 w-3.5 text-slate-500" /></button> : <><Link href="/login" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white sm:flex"><LogIn className="h-4 w-4" />{language === "vi" ? "Đăng nhập" : "Sign in"}</Link><Link href="/register" className="hidden rounded-lg bg-sky-500 px-3.5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 sm:block">{language === "vi" ? "Đăng ký" : "Sign up"}</Link></>}
                    <button className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 text-slate-300 md:hidden" aria-label="Mở menu"><Menu className="h-4 w-4" /></button>
                </div>
            </div>
        </header>
    );
}
