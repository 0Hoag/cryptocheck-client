"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Search, ShieldCheck, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api";

type ScanIssue = { type: string; name: string; description: string; impact: number };
type ScanResult = { network: string; name: string; address: string; trust_score: number; issues: ScanIssue[]; safe_features: string[] };

function scoreTone(score: number) {
  if (score >= 75) return "text-emerald-300 border-emerald-400/30 bg-emerald-500/10";
  if (score >= 50) return "text-amber-200 border-amber-400/30 bg-amber-500/10";
  return "text-red-200 border-red-400/30 bg-red-500/10";
}

export default function ScannerPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");

  async function handleScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim()) return;
    const query = token.trim();
    if (["BNB", "ETH", "MATIC", "POL", "SOL", "BTC"].includes(query.toUpperCase())) {
      setResult(null);
      setError(`“${query.toUpperCase()}” là native coin, không có smart contract để quét. Hãy dán địa chỉ contract của token (bắt đầu bằng 0x), ví dụ WBNB thay vì BNB.`);
      return;
    }
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await apiClient.get<{ data: ScanResult }>("/api/v1/news-feed/scanner", { params: { token: query, lang: "vi" } });
      setResult(response.data.data);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(message?.includes("DexScreener") ? "Không tìm thấy token này. Hãy dùng địa chỉ contract đầy đủ (0x...) thay vì mã coin; native coin như BNB/ETH không thể quét trực tiếp." : (message || "Không thể quét token này. Hãy kiểm tra lại địa chỉ hoặc thử mạng được hỗ trợ."));
    } finally { setLoading(false); }
  }

  return <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
    <div className="mx-auto max-w-5xl">
      <section className="surface relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-4 flex items-center gap-2 eyebrow"><ShieldCheck className="h-4 w-4 text-sky-400" /> Token safety scanner</div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Kiểm tra rủi ro trước khi xuống tiền.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">CryptoCheck phân tích mã nguồn đã xác minh của smart contract để đưa ra điểm tin cậy, cảnh báo và các tín hiệu an toàn.</p>
          <form onSubmit={handleScan} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="token">Địa chỉ contract</label>
            <input id="token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Dán địa chỉ contract (0x...)" className="h-12 flex-1 rounded-xl border border-slate-700 bg-slate-950/80 px-4 font-mono text-sm text-white outline-none placeholder:font-sans placeholder:text-slate-500 focus:border-sky-400" />
            <button disabled={loading || !token.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} {loading ? "Đang quét" : "Quét token"}
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-500">Chỉ quét smart contract đã xác minh trên ETH, BSC, Base, Arbitrum và Polygon; BNB/ETH là native coin nên không có contract để quét.</p>
        </div>
      </section>

      {error && <div role="alert" className="mt-6 flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}

      {result && <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className={`surface p-6 ${scoreTone(result.trust_score)}`}>
          <div className="eyebrow text-current/70">Trust score</div>
          <div className="mt-2 text-6xl font-semibold tracking-tighter">{result.trust_score}<span className="text-2xl">/100</span></div>
          <div className="mt-6 border-t border-current/20 pt-5 text-sm">
            <div className="font-semibold text-slate-100">{result.name || "Unknown token"}</div>
            <div className="mt-1 break-all font-mono text-xs text-slate-400">{result.address}</div>
            <div className="mt-4 inline-flex rounded-md border border-slate-700 bg-slate-950/35 px-2 py-1 text-xs font-medium text-slate-300">{result.network || "Unknown network"}</div>
          </div>
        </div>
        <div className="surface p-6">
          <div className="flex items-center gap-2 eyebrow"><Sparkles className="h-4 w-4 text-sky-400" /> Kết quả phân tích</div>
          {result.issues.length > 0 ? <div className="mt-5 space-y-3">{result.issues.map((issue, index) => <div key={`${issue.name}-${index}`} className="rounded-xl border border-slate-800 bg-slate-900/55 p-4"><div className="flex items-start justify-between gap-4"><div><div className="font-medium text-slate-100">{issue.name}</div><p className="mt-1 text-sm leading-6 text-slate-400">{issue.description}</p></div><span className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-300">-{issue.impact}</span></div></div>)}</div> : <div className="mt-5 flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />Chưa phát hiện cảnh báo rủi ro từ các kiểm tra hiện có.</div>}
          {result.safe_features.length > 0 && <div className="mt-6 border-t border-slate-800 pt-5"><div className="eyebrow">Tín hiệu tích cực</div><div className="mt-3 flex flex-wrap gap-2">{result.safe_features.map((feature) => <span key={feature} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">{feature}</span>)}</div></div>}
        </div>
      </section>}
    </div>
  </main>;
}
