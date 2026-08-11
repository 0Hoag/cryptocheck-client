"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useCallback, useEffect, useSyncExternalStore } from "react";
import { AuthUser, getAuthUser } from "@/lib/auth";
import { translate, useLanguage } from "@/context/LanguageContext";

export default function RequireAuth({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("cryptocheck-auth-change", onStoreChange);
    return () => window.removeEventListener("cryptocheck-auth-change", onStoreChange);
  }, []);
  const user = useSyncExternalStore(subscribe, getAuthUser, () => null) as AuthUser | null;

  useEffect(() => {
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [pathname, router, user]);

  if (user === null) {
    return <main className="grid min-h-[calc(100vh-12rem)] place-items-center" aria-busy="true" role="status"><Loader2 className="h-6 w-6 animate-spin text-sky-400" aria-hidden="true" /><span className="sr-only">{translate(language, "Đang kiểm tra phiên đăng nhập", "Checking sign-in session")}</span></main>;
  }

  return <>{children}</>;
}
