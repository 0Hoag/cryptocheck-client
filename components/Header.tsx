"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ChevronDown, Globe2, LogIn, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { clearAuth, getAuthUser, AuthUser } from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";

export default function Header() {
    const pathname = usePathname();
    const { language, setLanguage } = useLanguage();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [accountOpen, setAccountOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const accountMenuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const sync = () => setUser(getAuthUser());
        sync();
        window.addEventListener("cryptocheck-auth-change", sync);
        return () => window.removeEventListener("cryptocheck-auth-change", sync);
    }, []);
    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) setAccountOpen(false);
        };
        window.addEventListener("mousedown", closeOnOutsideClick);
        return () => window.removeEventListener("mousedown", closeOnOutsideClick);
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
                    {user ? <div ref={accountMenuRef} className="relative hidden sm:block"><button type="button" onClick={() => setAccountOpen((current) => !current)} aria-expanded={accountOpen} aria-haspopup="menu" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-900"><UserRound className="h-4 w-4 text-sky-400" />{user.username}<ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${accountOpen ? "rotate-180" : ""}`} /></button>{accountOpen && <div role="menu" className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-xl shadow-black/40"><Link role="menuitem" href="/account" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"><UserRound className="h-4 w-4 text-sky-300" />Tài khoản</Link><Link role="menuitem" href={`/profile/${user.id}`} onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"><UserRound className="h-4 w-4 text-sky-300" />Hồ sơ công khai</Link><div className="my-1 h-px bg-slate-800" /><button type="button" role="menuitem" onClick={() => { setAccountOpen(false); clearAuth(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-200 hover:bg-red-500/10"><LogOut className="h-4 w-4" />Đăng xuất</button></div>}</div> : <><Link href="/login" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white sm:flex"><LogIn className="h-4 w-4" />{language === "vi" ? "Đăng nhập" : "Sign in"}</Link><Link href="/register" className="hidden rounded-lg bg-sky-500 px-3.5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 sm:block">{language === "vi" ? "Đăng ký" : "Sign up"}</Link></>}
                    <button type="button" onClick={() => setMobileOpen((current) => !current)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 text-slate-300 md:hidden" aria-label={mobileOpen ? "Đóng menu" : "Mở menu"} aria-expanded={mobileOpen}>{mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
                </div>
            </div>
            {mobileOpen && <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 md:hidden"><nav className="grid gap-1" aria-label="Điều hướng di động">{navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm font-medium ${pathname === item.href ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900"}`}>{item.label}</Link>)}</nav><div className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={() => setLanguage(language === "vi" ? "en" : "vi")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 px-3 text-xs font-semibold text-slate-300"><Globe2 className="h-3.5 w-3.5" />{language === "vi" ? "VN" : "EN"}</button>{user ? <><Link href="/account" onClick={() => setMobileOpen(false)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 px-3 text-xs font-semibold text-slate-200"><UserRound className="h-3.5 w-3.5 text-sky-400" />Tài khoản</Link><button type="button" onClick={() => { setMobileOpen(false); clearAuth(); }} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-red-200 hover:bg-red-500/10"><LogOut className="h-3.5 w-3.5" />Đăng xuất</button></> : <><Link href="/login" onClick={() => setMobileOpen(false)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-200"><LogIn className="h-3.5 w-3.5" />Đăng nhập</Link><Link href="/register" onClick={() => setMobileOpen(false)} className="ml-auto inline-flex h-9 items-center rounded-lg bg-sky-500 px-3 text-xs font-semibold text-slate-950">Đăng ký</Link></>}</div></div>}
        </header>
    );
}
