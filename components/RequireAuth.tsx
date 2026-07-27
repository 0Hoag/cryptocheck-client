"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import { AuthUser, getAuthUser } from "@/lib/auth";

export default function RequireAuth({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    const session = getAuthUser();
    setUser(session);
    if (!session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [pathname, router]);

  if (user === undefined || user === null) {
    return <main className="grid min-h-[calc(100vh-12rem)] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-sky-400" aria-label="Đang kiểm tra phiên đăng nhập" /></main>;
  }

  return <>{children}</>;
}
