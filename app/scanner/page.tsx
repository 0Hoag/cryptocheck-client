"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDollarSign, Info, Loader2, Search, ShieldCheck, Sparkles } from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { apiClient } from "@/lib/api";

type ScanIssue = { type: string; name: string; description: string; impact: number };
type ScanResult = { network: string; name: string; address: string; analysis_type: "contract" | "native_asset" | "market_asset" | "solana_mint"; source_available: boolean; score_available: boolean; trust_score: number; liquidity_usd?: number; volume_h24?: number; price_usd?: number; image_url?: string; market_provider?: string; dex_id?: string; pair_url?: string; pair_created_at?: number; market_confidence?: "high" | "medium" | "low"; issues: ScanIssue[]; safe_features: string[] };
type TokenCandidate = { address: string; network: string; name: string; symbol: string; liquidity_usd: number; volume_h24: number; price_usd: number; image_url?: string; dex_id?: string; pair_created_at?: number; contract_scan_supported: boolean };
type ScanHistoryItem = { id: string; input: string; network: string; analysis_type: ScanResult["analysis_type"]; trust_score: number; score_available: boolean; engine_version: string; created_at: string };

function scoreTone(score: number) {
  if (score >= 75) return "text-emerald-300 border-emerald-400/30 bg-emerald-500/10";
  if (score >= 50) return "text-amber-200 border-amber-400/30 bg-amber-500/10";
  return "text-red-200 border-red-400/30 bg-red-500/10";
}

function analysisLabel(type: ScanResult["analysis_type"]) {
  if (type === "native_asset") return "Native asset report";
  if (type === "market_asset") return "Market profile";
  if (type === "solana_mint") return "Solana mint authority check";
  return "Verified contract scan";
}

function explorerSourceURL(network: string, address: string) {
  const explorers: Record<string, string> = {
    eth: "https://etherscan.io",
    ethereum: "https://etherscan.io",
    bsc: "https://bscscan.com",
    base: "https://basescan.org",
    arbitrum: "https://arbiscan.io",
    polygon: "https://polygonscan.com",
  };
  const explorer = explorers[network.toLowerCase()];
  return explorer && address.startsWith("0x") ? `${explorer}/address/${address}#code` : "";
}

function inspectionScope(result: ScanResult) {
  if (result.analysis_type === "native_asset") return "Native asset không có token contract để đọc mã nguồn. Báo cáo chỉ mô tả phạm vi kỹ thuật của coin gốc.";
  if (result.analysis_type === "solana_mint") return "Đã kiểm tra quyền mint/freeze của SPL mint. Đây không phải audit toàn bộ Solana program.";
  if (result.source_available) return "Đã chạy rule-based checks trên source contract công khai đã được verify tại blockchain explorer.";
  return "Chưa có source contract công khai phù hợp để phân tích. Kết quả này chỉ là market profile, không có điểm bảo mật.";
}

function usd(value?: number) {
  if (value === undefined || value === null) return "Chưa có dữ liệu";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function volume24h(value?: number) {
  if (value === undefined || value === null) return "Chưa có dữ liệu";
  if (value === 0) return "Chưa ghi nhận GD";
  return usd(value);
}

function tokenPrice(value?: number) {
  if (value === undefined || value === null || value <= 0) return "Chưa có dữ liệu";
  const digits = value < 0.0001 ? 8 : value < 0.01 ? 6 : value < 1 ? 4 : 2;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits }).format(value);
}

function confidenceLabel(confidence?: ScanResult["market_confidence"]) {
  if (confidence === "high") return "Cao";
  if (confidence === "medium") return "Trung bình";
  return "Thấp";
}

function dateFromUnixMs(value?: number) {
  if (!value) return "Chưa có dữ liệu";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function publicTokenIcon(symbol: string) {
  const normalized = symbol.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return normalized ? `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${normalized}.png` : "";
}

function TokenAvatar({ name, symbol, imageURL }: { name: string; symbol?: string; imageURL?: string }) {
  const imageSources = Array.from(new Set([imageURL, publicTokenIcon(symbol || "")].filter(Boolean))) as string[];
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => setImageIndex(0), [imageURL, symbol]);

  const imageSource = imageSources[imageIndex];
  if (!imageSource) {
    return <span aria-label={`${name} token icon`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-400/20 bg-sky-500/10 text-sm font-bold text-sky-200">{name.slice(0, 1).toUpperCase()}</span>;
  }
  return <img src={imageSource} alt={`${name} token icon`} className="h-10 w-10 shrink-0 rounded-full border border-slate-700 bg-slate-950 object-cover" onError={() => setImageIndex((index) => index + 1)} />;
}

export default function ScannerPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [candidates, setCandidates] = useState<TokenCandidate[]>([]);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lastAttempt, setLastAttempt] = useState("");

  async function loadHistory() {
    if (!getAuthToken()) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const response = await apiClient.get<{ data: ScanHistoryItem[] }>("/api/v1/news-feed/scanner/history", { params: { limit: 8 } });
      setHistory(response.data.data);
    } catch {
      // The shared API interceptor handles expired sessions. History is optional
      // and must never block an otherwise usable scanner.
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  function validateQuery(query: string) {
    if (query.startsWith("0x") && !/^0x[a-fA-F0-9]{40}$/.test(query)) {
      return "Địa chỉ EVM phải gồm 0x và đúng 40 ký tự hexadecimal. Nếu quét bằng mã token, hãy nhập symbol như ENA thay vì địa chỉ dở dang.";
    }
    if (query.length > 128) return "Giá trị quét quá dài. Hãy nhập symbol hoặc địa chỉ contract hợp lệ.";
    return "";
  }

  async function runScan(query: string) {
    setLastAttempt(query);
    setLoading(true); setError(""); setResult(null); setCandidates([]);
    try {
      const response = await apiClient.get<{ data: ScanResult }>("/api/v1/news-feed/scanner", { params: { token: query, lang: "vi" }, timeout: 45000 });
      setResult(response.data.data);
      void loadHistory();
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(err?.code === "ECONNABORTED" ? "Quét token mất quá 45 giây. Máy chủ nguồn có thể đang chậm — hãy thử lại sau ít phút." : (message?.includes("DexScreener") ? "Không tìm thấy token này. Hãy dùng địa chỉ contract đầy đủ hoặc thử đúng symbol; BTC, ETH, BNB và SOL đã có native asset report riêng." : (message || "Không thể quét token này. Hãy kiểm tra lại địa chỉ hoặc thử mạng được hỗ trợ.")));
    } finally { setLoading(false); }
  }

  async function startScan(rawQuery: string) {
    const query = rawQuery.trim();
    if (!query) return;
    setLastAttempt(query);
    const validationError = validateQuery(query);
    if (validationError) {
      setResult(null); setCandidates([]);
      setError(validationError);
      return;
    }
    const isEvmAddress = /^0x[a-fA-F0-9]{40}$/.test(query);
    const isNativeAsset = ["BTC", "ETH", "BNB", "SOL"].includes(query.toUpperCase());
    if (isEvmAddress || isNativeAsset) {
      await runScan(query);
      return;
    }
    setLoading(true); setError(""); setResult(null); setCandidates([]);
    try {
      const response = await apiClient.get<{ data: TokenCandidate[] }>("/api/v1/news-feed/scanner/candidates", { params: { token: query }, timeout: 15000 });
      setCandidates(response.data.data);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(err?.code === "ECONNABORTED" ? "Quét token mất quá 45 giây. Máy chủ nguồn có thể đang chậm — hãy thử lại sau ít phút." : (message?.includes("DexScreener") ? "Không tìm thấy token này. Hãy dùng địa chỉ contract đầy đủ hoặc thử đúng symbol; BTC, ETH, BNB và SOL đã có native asset report riêng." : (message || "Không thể quét token này. Hãy kiểm tra lại địa chỉ hoặc thử mạng được hỗ trợ.")));
    } finally { setLoading(false); }
  }

  async function handleScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await startScan(token);
  }

  return <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
    <div className="mx-auto max-w-5xl">
      <section className="surface relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-4 flex items-center gap-2 eyebrow"><ShieldCheck className="h-4 w-4 text-sky-400" /> Token safety scanner</div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Kiểm tra rủi ro trước khi xuống tiền.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">CryptoCheck phân tích tín hiệu từ source contract công khai đã verify và dữ liệu thị trường để hỗ trợ quyết định.</p>
          <form onSubmit={handleScan} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="token">Địa chỉ contract</label>
            <input id="token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Dán địa chỉ contract (0x...)" className="h-12 flex-1 rounded-xl border border-slate-700 bg-slate-950/80 px-4 font-mono text-sm text-white outline-none placeholder:font-sans placeholder:text-slate-500 focus:border-sky-400" />
            <button disabled={loading || !token.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} {loading ? "Đang quét" : "Quét token"}
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-500">Contract đã xác minh trên ETH, BSC, Base, Arbitrum và Polygon nhận security scan; token ở chain khác vẫn có market profile từ DexScreener, không gắn điểm bảo mật khi chưa đủ dữ liệu. Kết quả tự động không phải audit hoặc cam kết tài sản an toàn.</p>
        </div>
      </section>

      {error && <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100 sm:flex-row sm:items-center"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => { setError(""); setResult(null); }} className="rounded-lg border border-red-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/10">Nhập lại</button>{lastAttempt && <button type="button" onClick={() => void startScan(lastAttempt)} className="rounded-lg border border-red-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/10">Thử lại</button>}</div></div>}

      {getAuthToken() && <section className="surface mt-6 p-5"><div className="flex items-center justify-between gap-3"><div><div className="eyebrow">Tài khoản của bạn</div><h2 className="mt-1 text-base font-semibold text-white">Lịch sử quét gần đây</h2></div>{historyLoading && <Loader2 className="h-4 w-4 animate-spin text-sky-300" />}</div>{history.length > 0 ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{history.map((item) => <button key={item.id} type="button" onClick={() => { setToken(item.input); void runScan(item.input); }} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/55 px-3 py-2.5 text-left transition hover:border-sky-400/45 hover:bg-sky-500/5"><div className="min-w-0"><div className="truncate font-mono text-sm font-semibold text-slate-100">{item.input}</div><div className="mt-1 text-xs text-slate-500">{item.network} · {dateTime(item.created_at)}</div></div>{item.score_available ? <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${scoreTone(item.trust_score)}`}>{item.trust_score}/100</span> : <span className="shrink-0 rounded-md bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-200">Market</span>}</button>)}</div> : !historyLoading && <p className="mt-3 text-sm text-slate-400">Chưa có lượt quét nào được lưu trong tài khoản này.</p>}</section>}

      {candidates.length > 0 && <section className="surface mt-6 p-6"><div className="flex items-center gap-2 eyebrow"><Search className="h-4 w-4 text-sky-400" /> Chọn đúng tài sản để quét</div><p className="mt-2 text-sm leading-6 text-slate-400">So sánh logo, giá, chain, thanh khoản, volume và DEX trước khi chọn token đúng.</p><div className="mt-5 grid gap-3">{candidates.map((candidate) => <button key={`${candidate.network}-${candidate.address}`} type="button" onClick={() => { setToken(candidate.address); void runScan(candidate.address); }} className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/55 p-4 text-left transition hover:border-sky-400/45 hover:bg-sky-500/5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><TokenAvatar name={candidate.name} symbol={candidate.symbol} imageURL={candidate.image_url} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-100">{candidate.name} ({candidate.symbol})</span><span className="rounded-md border border-slate-700 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-300">{candidate.network}</span>{candidate.contract_scan_supported ? <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-200">Có thể security scan</span> : <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-200">Market profile</span>}</div><div className="mt-1 break-all font-mono text-xs text-slate-500">{candidate.address}</div><div className="mt-1 text-xs text-slate-500">DEX: {candidate.dex_id || "Chưa rõ"} · Pair từ {dateFromUnixMs(candidate.pair_created_at)}</div></div></div><div className="grid grid-cols-3 gap-4 text-xs text-slate-400 sm:text-right"><span>Giá hiện tại <strong className="mt-1 block text-sm text-sky-200">{tokenPrice(candidate.price_usd)}</strong></span><span>Thanh khoản <strong className="mt-1 block text-sm text-slate-200">{usd(candidate.liquidity_usd)}</strong></span><span>Volume 24h <strong className="mt-1 block text-sm text-slate-200">{volume24h(candidate.volume_h24)}</strong></span></div></button>)}</div></section>}

      {result && <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className={`surface p-6 ${result.score_available ? scoreTone(result.trust_score) : "border-sky-400/20 bg-sky-500/5 text-sky-100"}`}>
          <div className="eyebrow text-current/70">{result.score_available ? (result.analysis_type === "solana_mint" ? "Authority risk score" : "Trust score") : "Market profile"}</div>
          {result.score_available ? <div className="mt-2 text-6xl font-semibold tracking-tighter">{result.trust_score}<span className="text-2xl">/100</span></div> : <><div className="mt-3 flex items-center gap-2 text-xl font-semibold"><CircleDollarSign className="h-6 w-6 text-sky-300" />Đã nhận diện tài sản</div><p className="mt-2 text-sm leading-6 text-slate-300">Chưa có security score vì chain hoặc source code chưa được scanner hỗ trợ.</p></>}
          {result.analysis_type === "solana_mint" && <p className="mt-3 text-xs leading-5 text-slate-300">Điểm này chỉ phản ánh quyền mint/freeze của SPL token; không phải audit toàn bộ Solana program.</p>}
          <div className="mt-6 border-t border-current/20 pt-5 text-sm">
            <div className="flex items-center gap-3"><TokenAvatar name={result.name || "Unknown token"} symbol={result.analysis_type === "native_asset" ? result.address : result.name} imageURL={result.image_url} /><div className="font-semibold text-slate-100">{result.name || "Unknown token"}</div></div>
            <div className="mt-1 break-all font-mono text-xs text-slate-400">{result.address}</div>
            <div className="mt-4 flex flex-wrap gap-2"><span className="inline-flex rounded-md border border-slate-700 bg-slate-950/35 px-2 py-1 text-xs font-medium text-slate-300">{result.network || "Unknown network"}</span><span className="inline-flex rounded-md border border-slate-700 bg-slate-950/35 px-2 py-1 text-xs font-medium text-slate-300">{analysisLabel(result.analysis_type)}</span></div>
            <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3 text-xs leading-5 text-slate-300"><div className="flex items-center gap-2 font-semibold text-amber-100"><Info className="h-4 w-4 shrink-0" /> Phạm vi kiểm tra</div><p className="mt-2">{inspectionScope(result)}</p>{result.source_available && <p className="mt-2 text-slate-400">Nguồn code: blockchain explorer của chain tương ứng. Dữ liệu thị trường (nếu có): {result.market_provider || "DexScreener"}.</p>}{explorerSourceURL(result.network, result.address) && <a href={explorerSourceURL(result.network, result.address)} target="_blank" rel="noreferrer" className="mt-2 inline-flex font-medium text-sky-300 hover:text-sky-200">Xem source public trên explorer ↗</a>}<p className="mt-2 text-slate-400">Kết quả là tín hiệu tự động, không phải chứng nhận audit hoặc cam kết tài sản an toàn.</p></div>
            {result.analysis_type === "market_asset" && <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-lg border border-sky-400/15 bg-slate-950/35 p-3"><div className="text-xs text-slate-400">Thanh khoản</div><div className="mt-1 text-sm font-semibold text-slate-100">{usd(result.liquidity_usd)}</div></div><div className="rounded-lg border border-sky-400/15 bg-slate-950/35 p-3"><div className="text-xs text-slate-400">Khối lượng 24h</div><div className="mt-1 text-sm font-semibold text-slate-100">{volume24h(result.volume_h24)}</div></div></div>}
            {result.analysis_type === "market_asset" && <div className="mt-3 rounded-lg border border-sky-400/15 bg-slate-950/35 p-3 text-xs"><div className="flex items-center justify-between gap-3"><span className="text-slate-400">Nguồn dữ liệu</span><span className="font-medium text-slate-200">{result.market_provider || "Market provider"} · {result.dex_id || "DEX"}</span></div><div className="mt-2 flex items-center justify-between gap-3"><span className="text-slate-400">Pair từ</span><span className="font-medium text-slate-200">{dateFromUnixMs(result.pair_created_at)}</span></div><div className="mt-2 flex items-center justify-between gap-3"><span className="text-slate-400">Confidence dữ liệu</span><span className="font-medium text-sky-200">{confidenceLabel(result.market_confidence)}</span></div>{result.pair_url && <a href={result.pair_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex font-medium text-sky-300 hover:text-sky-200">Mở pair trên DexScreener ↗</a>}</div>}
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
