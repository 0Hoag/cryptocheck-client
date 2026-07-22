"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDollarSign, Loader2, Search, ShieldCheck, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api";

type ScanIssue = { type: string; name: string; description: string; impact: number };
type ScanResult = { network: string; name: string; address: string; analysis_type: "contract" | "native_asset" | "market_asset"; source_available: boolean; score_available: boolean; trust_score: number; liquidity_usd?: number; volume_h24?: number; issues: ScanIssue[]; safe_features: string[] };

function scoreTone(score: number) {
  if (score >= 75) return "text-emerald-300 border-emerald-400/30 bg-emerald-500/10";
  if (score >= 50) return "text-amber-200 border-amber-400/30 bg-amber-500/10";
  return "text-red-200 border-red-400/30 bg-red-500/10";
}

function analysisLabel(type: ScanResult["analysis_type"]) {
  if (type === "native_asset") return "Native asset report";
  if (type === "market_asset") return "Market profile";
  return "Verified contract scan";
}

function usd(value?: number) {
  if (value === undefined || value === null) return "Chưa có dữ liệu";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function ScannerPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");

  function validateQuery(query: string) {
    if (query.startsWith("0x") && !/^0x[a-fA-F0-9]{40}$/.test(query)) {
      return "Địa chỉ EVM phải gồm 0x và đúng 40 ký tự hexadecimal. Nếu quét bằng mã token, hãy nhập symbol như ENA thay vì địa chỉ dở dang.";
    }
    if (query.length > 128) return "Giá trị quét quá dài. Hãy nhập symbol hoặc địa chỉ contract hợp lệ.";
    return "";
  }

  async function handleScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim()) return;
    const query = token.trim();
    const validationError = validateQuery(query);
    if (validationError) {
      setResult(null);
      setError(validationError);
      return;
    }
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await apiClient.get<{ data: ScanResult }>("/api/v1/news-feed/scanner", { params: { token: query, lang: "vi" }, timeout: 45000 });
      setResult(response.data.data);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(err?.code === "ECONNABORTED" ? "Quét token mất quá 45 giây. Máy chủ nguồn có thể đang chậm — hãy thử lại sau ít phút." : (message?.includes("DexScreener") ? "Không tìm thấy token này. Hãy dùng địa chỉ contract đầy đủ hoặc thử đúng symbol; BTC, ETH, BNB và SOL đã có native asset report riêng." : (message || "Không thể quét token này. Hãy kiểm tra lại địa chỉ hoặc thử mạng được hỗ trợ.")));
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
          <p className="mt-3 text-xs text-slate-500">Contract đã xác minh trên ETH, BSC, Base, Arbitrum và Polygon nhận security scan; token ở chain khác vẫn có market profile từ DexScreener, không gắn điểm bảo mật khi chưa đủ dữ liệu.</p>
        </div>
      </section>

      {error && <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100 sm:flex-row sm:items-center"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div><button type="button" onClick={() => { setError(""); setResult(null); }} className="shrink-0 rounded-lg border border-red-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/10">Nhập lại</button></div>}

      {result && <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className={`surface p-6 ${result.score_available ? scoreTone(result.trust_score) : "border-sky-400/20 bg-sky-500/5 text-sky-100"}`}>
          <div className="eyebrow text-current/70">{result.score_available ? "Trust score" : "Market profile"}</div>
          {result.score_available ? <div className="mt-2 text-6xl font-semibold tracking-tighter">{result.trust_score}<span className="text-2xl">/100</span></div> : <><div className="mt-3 flex items-center gap-2 text-xl font-semibold"><CircleDollarSign className="h-6 w-6 text-sky-300" />Đã nhận diện tài sản</div><p className="mt-2 text-sm leading-6 text-slate-300">Chưa có security score vì chain hoặc source code chưa được scanner hỗ trợ.</p></>}
          <div className="mt-6 border-t border-current/20 pt-5 text-sm">
            <div className="font-semibold text-slate-100">{result.name || "Unknown token"}</div>
            <div className="mt-1 break-all font-mono text-xs text-slate-400">{result.address}</div>
            <div className="mt-4 flex flex-wrap gap-2"><span className="inline-flex rounded-md border border-slate-700 bg-slate-950/35 px-2 py-1 text-xs font-medium text-slate-300">{result.network || "Unknown network"}</span><span className="inline-flex rounded-md border border-slate-700 bg-slate-950/35 px-2 py-1 text-xs font-medium text-slate-300">{analysisLabel(result.analysis_type)}</span></div>
            {result.analysis_type === "market_asset" && <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-lg border border-sky-400/15 bg-slate-950/35 p-3"><div className="text-xs text-slate-400">Thanh khoản</div><div className="mt-1 text-sm font-semibold text-slate-100">{usd(result.liquidity_usd)}</div></div><div className="rounded-lg border border-sky-400/15 bg-slate-950/35 p-3"><div className="text-xs text-slate-400">Khối lượng 24h</div><div className="mt-1 text-sm font-semibold text-slate-100">{usd(result.volume_h24)}</div></div></div>}
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
