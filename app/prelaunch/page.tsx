"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, ExternalLink, Loader2, Radar } from "lucide-react";
import { apiClient } from "@/lib/api";

type Project = { id?: string; name: string; symbol?: string; website_url: string; social_urls: string[]; claimed_chain?: string; launch_at?: string; evidence: string[]; risk_flags: string[] };

export default function PrelaunchPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { apiClient.get<{ data: Project[] }>("/api/v1/news-feed/prelaunch-projects").then((r) => setProjects(r.data.data)).catch(() => setError("Không tải được watchlist lúc này.")).finally(() => setLoading(false)); }, []);
  return <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12"><div className="mx-auto max-w-5xl"><section className="surface p-7 sm:p-10"><div className="eyebrow flex items-center gap-2"><Radar className="h-4 w-4 text-sky-400" /> Pre-launch watchlist</div><h1 className="mt-4 text-3xl font-semibold text-white">Theo dõi dự án trước khi có token.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Đây là due diligence dựa trên website, social, chain công bố và bằng chứng. Dự án chưa deploy contract sẽ không có security score.</p></section>{loading && <div className="mt-6 flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Đang tải watchlist</div>}{error && <div className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}{!loading && !error && <div className="mt-6 grid gap-4 md:grid-cols-2">{projects.map((p) => <article key={`${p.name}-${p.website_url}`} className="surface p-5"><div className="flex justify-between gap-3"><div><h2 className="font-semibold text-white">{p.name} {p.symbol && <span className="text-sky-300">${p.symbol}</span>}</h2><p className="mt-1 text-xs text-slate-400">Claimed chain: {p.claimed_chain || "Chưa công bố"}</p></div><a href={p.website_url} target="_blank" rel="noreferrer" className="text-sky-300"><ExternalLink className="h-4 w-4" /></a></div>{p.launch_at && <div className="mt-4 flex gap-2 text-sm text-slate-300"><CalendarClock className="h-4 w-4 text-sky-400" />{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(p.launch_at))}</div>}<div className="mt-4 space-y-2">{p.risk_flags.map((flag) => <div key={flag} className="flex gap-2 text-xs text-amber-100"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />{flag}</div>)}</div></article>)}{projects.length === 0 && <div className="surface p-6 text-sm text-slate-400">Chưa có dự án nào trong watchlist.</div>}</div>}</div></main>;
}
