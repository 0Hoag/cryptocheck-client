"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bell, CheckCheck, ChevronDown, Globe2, Loader2, LogIn, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { clearAuth, getAuthUser, AuthUser } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { AppNotification, notificationCopy, notificationHref, parseNotificationsResponse } from "@/lib/notifications";
import { formatDate, getErrorMessage } from "@/lib/utils";
import { translate, useLanguage } from "@/context/LanguageContext";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { language, setLanguage } = useLanguage();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [accountOpen, setAccountOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationError, setNotificationError] = useState("");
    const [notificationMutationLoading, setNotificationMutationLoading] = useState(false);
    const [notificationRetry, setNotificationRetry] = useState<(() => Promise<void>) | null>(null);
    const accountMenuRef = useRef<HTMLDivElement>(null);
    const notificationMenuRef = useRef<HTMLDivElement>(null);
    const accountButtonRef = useRef<HTMLButtonElement>(null);
    const notificationButtonRef = useRef<HTMLButtonElement>(null);
    const mobileButtonRef = useRef<HTMLButtonElement>(null);
    const languageRef = useRef(language);
    useEffect(() => {
        languageRef.current = language;
    }, [language]);
    useEffect(() => {
        const sync = () => setUser(getAuthUser());
        sync();
        window.addEventListener("cryptocheck-auth-change", sync);
        return () => window.removeEventListener("cryptocheck-auth-change", sync);
    }, []);
    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) setAccountOpen(false);
            if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) setNotificationOpen(false);
        };
        window.addEventListener("mousedown", closeOnOutsideClick);
        return () => window.removeEventListener("mousedown", closeOnOutsideClick);
    }, []);
    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            if (notificationOpen) {
                setNotificationOpen(false);
                notificationButtonRef.current?.focus();
                return;
            }
            if (accountOpen) {
                setAccountOpen(false);
                accountButtonRef.current?.focus();
                return;
            }
            if (mobileOpen) {
                setMobileOpen(false);
                mobileButtonRef.current?.focus();
            }
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [accountOpen, mobileOpen, notificationOpen]);
    const loadNotifications = useCallback(async () => {
        if (!getAuthUser()) return;
        setNotificationsLoading(true); setNotificationError("");
        try {
            const response = await apiClient.get<unknown>("/api/v1/news-feed/notifications");
            setNotifications(parseNotificationsResponse(response.data));
        }
        catch (error) { setNotificationError(getErrorMessage(error, translate(languageRef.current, "Không tải được thông báo.", "Unable to load notifications."))); }
        finally { setNotificationsLoading(false); }
    }, []);
    async function markNotificationRead(id: string) {
        setNotificationMutationLoading(true);
        setNotificationError("");
        try {
            await apiClient.post(`/api/v1/news-feed/notifications/${id}/read`);
            setNotifications((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
            setNotificationRetry(null);
            return true;
        } catch (error) {
            setNotificationError(getErrorMessage(error, translate(languageRef.current, "Không thể cập nhật thông báo.", "Unable to update notification.")));
            setNotificationRetry(() => async () => { await markNotificationRead(id); });
            return false;
        } finally { setNotificationMutationLoading(false); }
    }
    async function markAllNotificationsRead() {
        setNotificationMutationLoading(true);
        setNotificationError("");
        try {
            await apiClient.post("/api/v1/news-feed/notifications/read-all");
            setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
            setNotificationRetry(null);
        } catch (error) {
            setNotificationError(getErrorMessage(error, translate(languageRef.current, "Không thể cập nhật thông báo.", "Unable to update notifications.")));
            setNotificationRetry(() => markAllNotificationsRead);
        } finally { setNotificationMutationLoading(false); }
    }
    useEffect(() => {
        if (!user) { setNotifications([]); setNotificationError(""); return; }
        void loadNotifications();
    }, [user, loadNotifications]);
    const navigation = [
        { href: "/", label: language === "vi" ? "Trang chủ" : "Home" },
        { href: "/news", label: language === "vi" ? "Tin tức" : "News" },
        { href: "/community", label: language === "vi" ? "Cộng đồng" : "Community" },
        { href: "/groups", label: language === "vi" ? "Group" : "Groups" },
        { href: "/analysis", label: language === "vi" ? "Phân tích" : "Analysis" },
        { href: "/scanner", label: language === "vi" ? "Quét token" : "Scan token" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-800/90 bg-slate-950/85 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6">
                <Link href="/" className="group flex items-center gap-2.5" aria-label={translate(language, "Trang chủ CryptoCheck", "CryptoCheck home")}>
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-300 transition group-hover:bg-sky-500/25">
                        <ShieldCheck className="h-5 w-5" />
                    </span>
                    <span className="text-lg font-bold tracking-tight text-slate-50">Crypto<span className="text-sky-400">Check</span></span>
                </Link>

                <nav className="hidden items-center gap-1 md:flex" aria-label={translate(language, "Điều hướng chính", "Primary navigation")}>
                    {navigation.map((item) => {
                        const active = pathname === item.href;
                        return <Link key={item.href} href={item.href} className={`rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"}`}>{item.label}</Link>;
                    })}
                </nav>

                    <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setLanguage(language === "vi" ? "en" : "vi")} className="hidden h-9 items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-900 sm:flex" aria-label={translate(language, "Chuyển sang tiếng Anh", "Switch to Vietnamese")}><Globe2 className="h-3.5 w-3.5" />{language === "vi" ? "VN" : "EN"}</button>
                    <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 sm:flex"><Activity className="h-3.5 w-3.5" aria-hidden="true" />{translate(language, "Trực tuyến", "Live")}</div>
                    {user && <div ref={notificationMenuRef} className="relative hidden sm:block">
                        <button ref={notificationButtonRef} type="button" onClick={() => { setNotificationOpen((current) => !current); if (!notificationOpen) void loadNotifications(); }} aria-controls="notification-menu" aria-expanded={notificationOpen} aria-haspopup="menu" aria-label={translate(language, "Thông báo", "Notifications")} className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-800 text-slate-300 transition hover:bg-slate-900"><Bell className="h-4 w-4" />{notifications.some((item) => !item.read_at) && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-sky-400 ring-2 ring-slate-950" />}</button>
                        {notificationOpen && <div id="notification-menu" role="menu" className="absolute right-0 mt-2 w-[22rem] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/40">
                            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><p className="font-semibold text-slate-100">{translate(language, "Thông báo", "Notifications")}</p><button type="button" onClick={() => void markAllNotificationsRead()} disabled={!notifications.some((item) => !item.read_at) || notificationMutationLoading} className="inline-flex items-center gap-1 text-xs font-semibold text-sky-300 hover:text-sky-100 disabled:opacity-40">{notificationMutationLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}{translate(language, "Đọc tất cả", "Mark all read")}</button></div>
                            {notificationsLoading ? <div className="grid place-items-center px-4 py-8"><Loader2 className="h-5 w-5 animate-spin text-sky-300" /></div> : notificationError ? <div role="alert" className="p-4 text-sm text-red-200"><p>{notificationError}</p><button type="button" disabled={notificationMutationLoading} onClick={() => void (notificationRetry ? notificationRetry() : loadNotifications())} className="mt-2 text-xs font-semibold text-sky-300 hover:text-sky-100 disabled:opacity-50">{translate(language, "Thử lại", "Retry")}</button></div> : notifications.length ? <div className="max-h-96 overflow-y-auto">{notifications.map((item) => <button key={item.id} type="button" role="menuitem" disabled={notificationMutationLoading} onClick={async () => { const marked = item.read_at ? true : await markNotificationRead(item.id); if (!marked) return; const href = notificationHref(item); if (href) { setNotificationOpen(false); router.push(href); } }} className={`block w-full border-b border-slate-800 px-4 py-3 text-left transition hover:bg-slate-900 disabled:opacity-60 ${item.read_at ? "" : "bg-sky-500/5"}`}><p className="text-sm leading-5 text-slate-200">{notificationCopy(item.type, item.message, language)}</p><p className="mt-1 text-xs text-slate-500">{formatDate(item.created_at, language)}</p></button>)}</div> : <p className="p-6 text-center text-sm text-slate-400">{translate(language, "Chưa có thông báo mới.", "You have no notifications yet.")}</p>}
                            <Link href="/notifications" onClick={() => setNotificationOpen(false)} className="block border-t border-slate-800 px-4 py-2.5 text-center text-xs font-semibold text-sky-300 hover:bg-slate-900 hover:text-sky-100">{translate(language, "Xem tất cả thông báo", "View all notifications")}</Link>
                        </div>}
                    </div>}{user ? <div ref={accountMenuRef} className="relative hidden sm:block"><button ref={accountButtonRef} type="button" onClick={() => setAccountOpen((current) => !current)} aria-controls="account-menu" aria-expanded={accountOpen} aria-haspopup="menu" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-900"><UserRound className="h-4 w-4 text-sky-400" />{user.username}<ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${accountOpen ? "rotate-180" : ""}`} /></button>{accountOpen && <div id="account-menu" role="menu" className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-xl shadow-black/40"><Link role="menuitem" href="/account" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"><UserRound className="h-4 w-4 text-sky-300" />{translate(language, "Tài khoản", "Account")}</Link><Link role="menuitem" href={`/profile/${user.id}`} onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"><UserRound className="h-4 w-4 text-sky-300" />{translate(language, "Hồ sơ công khai", "Public profile")}</Link><div className="my-1 h-px bg-slate-800" /><button type="button" role="menuitem" onClick={() => { setAccountOpen(false); clearAuth(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-200 hover:bg-red-500/10"><LogOut className="h-4 w-4" />{translate(language, "Đăng xuất", "Sign out")}</button></div>}</div> : <><Link href="/login" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white sm:flex"><LogIn className="h-4 w-4" />{language === "vi" ? "Đăng nhập" : "Sign in"}</Link><Link href="/register" className="hidden rounded-lg bg-sky-500 px-3.5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 sm:block">{language === "vi" ? "Đăng ký" : "Sign up"}</Link></>}
                    <button ref={mobileButtonRef} type="button" onClick={() => setMobileOpen((current) => !current)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 text-slate-300 md:hidden" aria-controls="mobile-navigation" aria-label={mobileOpen ? translate(language, "Đóng menu", "Close menu") : translate(language, "Mở menu", "Open menu")} aria-expanded={mobileOpen}>{mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
                </div>
            </div>
            {mobileOpen && <div id="mobile-navigation" className="border-t border-slate-800 bg-slate-950 px-4 py-3 md:hidden"><nav className="grid gap-1" aria-label={translate(language, "Điều hướng di động", "Mobile navigation")}>{navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm font-medium ${pathname === item.href ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900"}`}>{item.label}</Link>)}{user && <Link href="/notifications" onClick={() => setMobileOpen(false)} className={`relative rounded-lg px-3 py-2.5 text-sm font-medium ${pathname === "/notifications" ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900"}`}><Bell className="mr-2 inline h-4 w-4 text-sky-300" />{translate(language, "Thông báo", "Notifications")}{notifications.some((item) => !item.read_at) && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-sky-400" />}</Link>}</nav><div className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={() => setLanguage(language === "vi" ? "en" : "vi")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 px-3 text-xs font-semibold text-slate-300" aria-label={translate(language, "Chuyển sang tiếng Anh", "Switch to Vietnamese")}><Globe2 className="h-3.5 w-3.5" />{language === "vi" ? "VN" : "EN"}</button>{user ? <><Link href="/account" onClick={() => setMobileOpen(false)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 px-3 text-xs font-semibold text-slate-200"><UserRound className="h-3.5 w-3.5 text-sky-400" />{translate(language, "Tài khoản", "Account")}</Link><button type="button" onClick={() => { setMobileOpen(false); clearAuth(); }} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-red-200 hover:bg-red-500/10"><LogOut className="h-3.5 w-3.5" />{translate(language, "Đăng xuất", "Sign out")}</button></> : <><Link href="/login" onClick={() => setMobileOpen(false)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-200"><LogIn className="h-3.5 w-3.5" />{translate(language, "Đăng nhập", "Sign in")}</Link><Link href="/register" onClick={() => setMobileOpen(false)} className="ml-auto inline-flex h-9 items-center rounded-lg bg-sky-500 px-3 text-xs font-semibold text-slate-950">{translate(language, "Đăng ký", "Sign up")}</Link></>}</div></div>}
        </header>
    );
}
