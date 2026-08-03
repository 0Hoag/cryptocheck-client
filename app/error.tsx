"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { translate, useLanguage } from "@/context/LanguageContext";

// Last-resort route fallback: expected API failures render their own retry
// states, while an unexpected rendering error lands here instead of leaving a
// blank route in production.
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = useLanguage();

  useEffect(() => {
    // Keep diagnostics in the browser without showing implementation details
    // or provider responses to visitors.
    console.error("Route rendering error", error);
  }, [error]);

  return (
    <main className="grid min-h-[calc(100vh-12rem)] place-items-center px-4 py-12 sm:px-6">
      <section role="alert" aria-live="assertive" className="surface w-full max-w-lg p-7 text-center sm:p-9">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-red-400/25 bg-red-500/10 text-red-200">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <p className="eyebrow mt-5 text-red-200">
          {translate(language, "Có lỗi ngoài dự kiến", "Unexpected route error")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {translate(language, "Không thể mở trang này", "This page could not be opened")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {translate(language, "Hãy thử tải lại trang. Nếu lỗi tiếp diễn, quay về trang chủ và gửi mã hỗ trợ cho chúng tôi.", "Try loading the page again. If it keeps happening, return home and send us the support ID.")}
        </p>
        {error.digest && <p className="mt-3 break-all font-mono text-xs text-slate-500">Support ID: {error.digest}</p>}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
            <RefreshCw className="h-4 w-4" />
            {translate(language, "Thử tải lại", "Try again")}
          </button>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-900">
            <ArrowLeft className="h-4 w-4" />
            {translate(language, "Về trang chủ", "Back home")}
          </Link>
        </div>
      </section>
    </main>
  );
}
