"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDollarSign, Info, Loader2, Search, ShieldCheck, Sparkles } from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { isEvmAddress, isSolanaMintAddress, validateScanInput } from "@/lib/scanner-input";
import { parseScanHistory, parseScanQuota, parseScanResultResponse, parseTokenCandidates, type ScanHistoryItem, type ScanQuota, type ScanResult, type TokenCandidate } from "@/lib/scanner-data";
import { languageLocale, translate, useLanguage, type Language } from "@/context/LanguageContext";
import ExternalImage from "@/components/ExternalImage";


function scoreTone(score: number) {
  if (score >= 75) return "text-emerald-300 border-emerald-400/30 bg-emerald-500/10";
  if (score >= 50) return "text-amber-200 border-amber-400/30 bg-amber-500/10";
  return "text-red-200 border-red-400/30 bg-red-500/10";
}

function analysisLabel(language: Language, type: ScanResult["analysis_type"]) {
  if (type === "native_asset") return translate(language, "Báo cáo coin gốc", "Native asset report");
  if (type === "market_asset") return translate(language, "Hồ sơ thị trường", "Market profile");
  if (type === "solana_mint") return translate(language, "Kiểm tra quyền Solana mint", "Solana mint authority check");
  return translate(language, "Quét contract đã xác minh", "Verified contract scan");
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

function inspectionScope(language: Language, result: ScanResult) {
  if (result.analysis_type === "native_asset") return translate(language, "Coin gốc không có token contract để đọc mã nguồn. Báo cáo chỉ mô tả phạm vi kỹ thuật của tài sản này.", "A native asset has no token contract to inspect. This report only describes its technical scope.");
  if (result.analysis_type === "solana_mint") return translate(language, "Đã kiểm tra quyền mint/freeze của SPL mint. Đây không phải audit toàn bộ Solana program.", "Mint/freeze authority was checked for this SPL mint. This is not an audit of the whole Solana program.");
  if (result.source_available) return translate(language, "Đã chạy các rule kiểm tra trên source contract công khai đã được xác minh tại blockchain explorer.", "Rule-based checks ran against publicly verified contract source at the blockchain explorer.");
  return translate(language, "Chưa có source contract công khai phù hợp để phân tích. Kết quả này chỉ là hồ sơ thị trường, không có điểm bảo mật.", "No suitable public contract source is available. This result is a market profile without a security score.");
}

function usd(language: Language, value?: number) {
  if (value === undefined || value === null) return translate(language, "Chưa có dữ liệu", "No data available");
  return new Intl.NumberFormat(languageLocale(language), { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function volume24h(language: Language, value?: number) {
  if (value === undefined || value === null) return translate(language, "Chưa có dữ liệu", "No data available");
  if (value === 0) return translate(language, "Chưa ghi nhận GD", "No recorded trading");
  return usd(language, value);
}

function tokenPrice(language: Language, value?: number) {
  if (value === undefined || value === null || value <= 0) return translate(language, "Chưa có dữ liệu", "No data available");
  const digits = value < 0.0001 ? 8 : value < 0.01 ? 6 : value < 1 ? 4 : 2;
  return new Intl.NumberFormat(languageLocale(language), { style: "currency", currency: "USD", maximumFractionDigits: digits }).format(value);
}

function confidenceLabel(language: Language, confidence?: ScanResult["market_confidence"]) {
  if (confidence === "high") return translate(language, "Cao", "High");
  if (confidence === "medium") return translate(language, "Trung bình", "Medium");
  return translate(language, "Thấp", "Low");
}

function dateFromUnixMs(language: Language, value?: number) {
  if (!value) return translate(language, "Chưa có dữ liệu", "No data available");
  return new Intl.DateTimeFormat(languageLocale(language), { dateStyle: "medium" }).format(new Date(value));
}

function dateTime(language: Language, value: string) {
  return new Intl.DateTimeFormat(languageLocale(language), { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function publicTokenIcon(symbol: string) {
  const normalized = symbol.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return normalized ? `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${normalized}.png` : "";
}

function TokenAvatarImage({ name, symbol, imageURL }: { name: string; symbol?: string; imageURL?: string }) {
  const imageSources = Array.from(new Set([imageURL, publicTokenIcon(symbol || "")].filter(Boolean))) as string[];
  const [imageIndex, setImageIndex] = useState(0);

  const imageSource = imageSources[imageIndex];
  if (!imageSource) {
    return <span aria-label={`${name} token icon`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-400/20 bg-sky-500/10 text-sm font-bold text-sky-200">{name.slice(0, 1).toUpperCase()}</span>;
  }
  return <ExternalImage src={imageSource} alt={`${name} token icon`} className="h-10 w-10 shrink-0 rounded-full border border-slate-700 bg-slate-950 object-cover" onError={() => setImageIndex((index) => index + 1)} fallback={<span aria-label={`${name} token icon`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-400/20 bg-sky-500/10 text-sm font-bold text-sky-200">{name.slice(0, 1).toUpperCase()}</span>} />;
}

function TokenAvatar({ name, symbol, imageURL }: { name: string; symbol?: string; imageURL?: string }) {
  return <TokenAvatarImage key={`${imageURL || ""}:${symbol || ""}`} name={name} symbol={symbol} imageURL={imageURL} />;
}

function scannerErrorMessage(error: unknown, language: Language) {
  const candidate = error as { code?: unknown; response?: { data?: { message?: unknown } } };
  const message = typeof candidate.response?.data?.message === "string" ? candidate.response.data.message : "";
  if (candidate.code === "ECONNABORTED") return translate(language, "Quét token mất quá 45 giây. Máy chủ nguồn có thể đang chậm — hãy thử lại sau ít phút.", "The scan took longer than 45 seconds. The upstream source may be slow — please try again shortly.");
  if (message.includes("DexScreener")) return translate(language, "Không tìm thấy token này. Hãy dùng địa chỉ contract đầy đủ hoặc thử đúng symbol; BTC, ETH, BNB và SOL đã có native asset report riêng.", "This token was not found. Use the full contract address or correct symbol; BTC, ETH, BNB and SOL have dedicated native-asset reports.");
  return message || translate(language, "Không thể quét token này. Hãy kiểm tra lại địa chỉ hoặc thử mạng được hỗ trợ.", "This token could not be scanned. Check the address or try a supported network.");
}

export default function ScannerPage() {
  const { language } = useLanguage();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [candidates, setCandidates] = useState<TokenCandidate[]>([]);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [quota, setQuota] = useState<ScanQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaError, setQuotaError] = useState("");
  const [lastAttempt, setLastAttempt] = useState("");
  const tokenInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(async () => {
    if (!getAuthToken()) {
      setHistory([]);
      setHistoryError("");
      return;
    }
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const response = await apiClient.get<unknown>("/api/v1/news-feed/scanner/history", { params: { limit: 8 } });
      setHistory(parseScanHistory(response.data));
    } catch (requestError) {
      setHistory([]);
      setHistoryError(getErrorMessage(requestError, translate(language, "Không tải được lịch sử quét.", "Unable to load scan history.")));
    } finally {
      setHistoryLoading(false);
    }
  }, [language]);

  const loadQuota = useCallback(async () => {
    if (!getAuthToken()) {
      setQuota(null);
      setQuotaError("");
      return;
    }
    setQuotaLoading(true);
    setQuotaError("");
    try {
      const response = await apiClient.get<unknown>("/api/v1/news-feed/scanner/quota");
      setQuota(parseScanQuota(response.data));
    } catch (requestError) {
      setQuota(null);
      setQuotaError(getErrorMessage(requestError, translate(language, "Không tải được quyền quét hiện tại.", "Unable to load your current scan access.")));
    } finally {
      setQuotaLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void loadHistory();
    void loadQuota();
  }, [loadHistory, loadQuota]);

  function validateQuery(query: string) {
    const issue = validateScanInput(query);
    if (issue === "invalid_evm") {
      return translate(language, "Địa chỉ EVM phải gồm 0x và đúng 40 ký tự hexadecimal. Nếu quét bằng mã token, hãy nhập symbol như ENA thay vì địa chỉ dở dang.", "An EVM address must start with 0x and contain exactly 40 hexadecimal characters. For a symbol scan, enter a symbol such as ENA instead of a partial address.");
    }
    if (issue === "unsupported_direct") {
      return translate(language, "Địa chỉ trực tiếp hiện hỗ trợ EVM (0x + 40 ký tự) hoặc Solana SPL mint (base58, 32–44 ký tự). Với chain khác, hãy nhập symbol để chọn đúng market profile trước.", "Direct addresses currently support EVM (0x + 40 characters) and Solana SPL mints (base58, 32–44 characters). For another chain, enter the symbol first and choose the correct market profile.");
    }
    if (issue === "too_long") return translate(language, "Giá trị quét quá dài. Hãy nhập symbol hoặc địa chỉ contract hợp lệ.", "This scan input is too long. Enter a symbol or a valid contract address.");
    return "";
  }

  async function runScan(query: string) {
    setLastAttempt(query);
    setLoading(true); setError(""); setResult(null); setCandidates([]);
    try {
      const response = await apiClient.get<unknown>("/api/v1/news-feed/scanner", { params: { token: query, lang: language }, timeout: 45000 });
      setResult(parseScanResultResponse(response.data));
      void loadHistory();
      void loadQuota();
    } catch (error) {
      setError(scannerErrorMessage(error, language));
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
    const directAddress = isEvmAddress(query) || isSolanaMintAddress(query);
    const isNativeAsset = ["BTC", "ETH", "BNB", "SOL"].includes(query.toUpperCase());
    if (directAddress || isNativeAsset) {
      await runScan(query);
      return;
    }
    setLoading(true); setError(""); setResult(null); setCandidates([]);
    try {
      const response = await apiClient.get<unknown>("/api/v1/news-feed/scanner/candidates", { params: { token: query }, timeout: 15000 });
      setCandidates(parseTokenCandidates(response.data));
    } catch (error) {
      setError(scannerErrorMessage(error, language));
    } finally { setLoading(false); }
  }

  async function handleScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await startScan(token);
  }

  function editScanInput() {
    setError("");
    setResult(null);
    tokenInputRef.current?.focus();
  }

  return <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
    <div className="mx-auto max-w-5xl">
      <section className="surface relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-4 flex items-center gap-2 eyebrow"><ShieldCheck className="h-4 w-4 text-sky-400" /> {translate(language, "Công cụ quét độ an toàn token", "Token safety scanner")}</div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{translate(language, "Kiểm tra rủi ro trước khi xuống tiền.", "Check risk before you invest.")}</h1>
          <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">{translate(language, "CryptoCheck phân tích tín hiệu từ source contract công khai đã được xác minh và dữ liệu thị trường để hỗ trợ quyết định.", "CryptoCheck analyzes signals from publicly verified contract source and market data to support your decision.")}</p>
          <form onSubmit={handleScan} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="token">{translate(language, "Symbol hoặc địa chỉ contract", "Symbol or contract address")}</label>
            <input ref={tokenInputRef} id="token" value={token} onChange={(event) => setToken(event.target.value)} placeholder={translate(language, "Symbol, EVM 0x... hoặc Solana mint", "Symbol, EVM 0x... or Solana mint")} aria-describedby="scanner-input-help" className="h-12 flex-1 rounded-xl border border-slate-700 bg-slate-950/80 px-4 font-mono text-sm text-white outline-none placeholder:font-sans placeholder:text-slate-500 focus:border-sky-400" />
            <button disabled={loading || !token.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} {loading ? translate(language, "Đang quét", "Scanning") : translate(language, "Quét token", "Scan token")}
            </button>
          </form>
          <p id="scanner-input-help" className="mt-3 text-xs text-slate-500">{translate(language, "Quét trực tiếp hỗ trợ địa chỉ EVM và Solana SPL mint. Contract đã xác minh trên ETH, BSC, Base, Arbitrum và Polygon nhận security scan; token ở chain khác vẫn có hồ sơ thị trường từ DexScreener, không gắn điểm bảo mật khi chưa đủ dữ liệu. Kết quả tự động không phải audit hoặc cam kết tài sản an toàn.", "Direct scanning supports EVM addresses and Solana SPL mints. Verified contracts on ETH, BSC, Base, Arbitrum and Polygon receive a security scan; tokens on other chains can still receive a DexScreener market profile without a security score. Automated results are not an audit or safety guarantee.")}</p>
          <div aria-live="polite" className="mt-5 inline-flex max-w-full items-center gap-2 rounded-lg border border-sky-400/20 bg-sky-500/5 px-3 py-2 text-xs text-sky-100">
            <Sparkles className="h-4 w-4 shrink-0 text-sky-300" />
            {!getAuthToken()
              ? translate(language, "Đăng nhập để dùng gói Free: 2 lượt quét thành công mỗi ngày. Premium: không giới hạn.", "Sign in to use Free: 2 successful scans per day. Premium: unlimited.")
              : quotaLoading
                ? translate(language, "Đang kiểm tra quyền quét…", "Checking scanner entitlement…")
                : quota?.unlimited
                  ? translate(language, "Premium đang hoạt động — lượt quét không giới hạn.", "Premium is active — scans are unlimited.")
                    : quota
                    ? translate(language, `Gói Free: đã dùng ${quota.used}/${quota.limit} lượt quét thành công hôm nay.`, `Free plan: ${quota.used}/${quota.limit} successful scans used today.`)
                    : quotaError
                      ? translate(language, "Chưa tải được quyền quét — máy chủ vẫn sẽ kiểm tra trước mỗi lượt quét.", "Scan access could not be loaded — the server will still verify it before every scan.")
                      : translate(language, "Quyền quét sẽ được máy chủ kiểm tra trước mỗi lượt quét.", "The server will verify your scanner entitlement before every scan.")}
            {!quotaLoading && quotaError && <button type="button" onClick={() => void loadQuota()} className="shrink-0 font-semibold text-sky-200 underline underline-offset-2 hover:text-sky-100">{translate(language, "Thử lại", "Retry")}</button>}
            {!quotaLoading && quota && !quota.unlimited && <Link href="/account#premium" className="shrink-0 font-semibold text-amber-200 underline underline-offset-2 hover:text-amber-100">{translate(language, "Xem Premium", "View Premium")}</Link>}
          </div>
        </div>
      </section>

      {error && <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100 sm:flex-row sm:items-center"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={editScanInput} className="rounded-lg border border-red-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/10">{translate(language, "Nhập lại", "Edit input")}</button>{lastAttempt && <button type="button" onClick={() => void startScan(lastAttempt)} className="rounded-lg border border-red-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/10">{translate(language, "Thử lại", "Retry")}</button>}</div></div>}

      {getAuthToken() && <section className="surface mt-6 p-5"><div className="flex items-center justify-between gap-3"><div><div className="eyebrow">{translate(language, "Tài khoản của bạn", "Your account")}</div><h2 className="mt-1 text-base font-semibold text-white">{translate(language, "Lịch sử quét gần đây", "Recent scan history")}</h2></div>{historyLoading && <Loader2 className="h-4 w-4 animate-spin text-sky-300" />}</div>{historyError ? <div role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100"><p>{historyError}</p><button type="button" onClick={() => void loadHistory()} className="mt-2 font-semibold text-sky-300 hover:text-sky-100">{translate(language, "Thử lại", "Retry")}</button></div> : history.length > 0 ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{history.map((item) => <button key={item.id} type="button" onClick={() => { setToken(item.input); void runScan(item.input); }} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/55 px-3 py-2.5 text-left transition hover:border-sky-400/45 hover:bg-sky-500/5"><div className="min-w-0"><div className="truncate font-mono text-sm font-semibold text-slate-100">{item.input}</div><div className="mt-1 text-xs text-slate-500">{item.network} · {dateTime(language, item.created_at)}</div></div>{item.score_available ? <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${scoreTone(item.trust_score)}`}>{item.trust_score}/100</span> : <span className="shrink-0 rounded-md bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-200">{translate(language, "Thị trường", "Market")}</span>}</button>)}</div> : !historyLoading && <p className="mt-3 text-sm text-slate-400">{translate(language, "Chưa có lượt quét nào được lưu trong tài khoản này.", "No scans have been saved to this account yet.")}</p>}</section>}

      {candidates.length > 0 && <section className="surface mt-6 p-6"><div className="flex items-center gap-2 eyebrow"><Search className="h-4 w-4 text-sky-400" /> {translate(language, "Chọn đúng tài sản để quét", "Choose the asset to scan")}</div><p className="mt-2 text-sm leading-6 text-slate-400">{translate(language, "So sánh logo, giá, chain, thanh khoản, volume và DEX trước khi chọn token đúng.", "Compare logo, price, chain, liquidity, volume and DEX before selecting the correct token.")}</p><div className="mt-5 grid gap-3">{candidates.map((candidate) => <button key={`${candidate.network}-${candidate.address}`} type="button" onClick={() => { setToken(candidate.address); void runScan(candidate.address); }} className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/55 p-4 text-left transition hover:border-sky-400/45 hover:bg-sky-500/5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><TokenAvatar name={candidate.name} symbol={candidate.symbol} imageURL={candidate.image_url} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-100">{candidate.name} ({candidate.symbol})</span><span className="rounded-md border border-slate-700 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-300">{candidate.network}</span>{candidate.contract_scan_supported ? <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-200">{translate(language, "Có thể security scan", "Security scan available")}</span> : <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-200">{translate(language, "Hồ sơ thị trường", "Market profile")}</span>}</div><div className="mt-1 break-all font-mono text-xs text-slate-500">{candidate.address}</div><div className="mt-1 text-xs text-slate-500">DEX: {candidate.dex_id || translate(language, "Chưa rõ", "Unknown")} · {translate(language, "Pair từ", "Pair since")} {dateFromUnixMs(language, candidate.pair_created_at)}</div></div></div><div className="grid grid-cols-3 gap-4 text-xs text-slate-400 sm:text-right"><span>{translate(language, "Giá hiện tại", "Current price")}<strong className="mt-1 block text-sm text-sky-200">{tokenPrice(language, candidate.price_usd)}</strong></span><span>{translate(language, "Thanh khoản", "Liquidity")}<strong className="mt-1 block text-sm text-slate-200">{usd(language, candidate.liquidity_usd)}</strong></span><span>{translate(language, "Volume 24h", "24h volume")}<strong className="mt-1 block text-sm text-slate-200">{volume24h(language, candidate.volume_h24)}</strong></span></div></button>)}</div></section>}

      {result && <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className={`surface p-6 ${result.score_available ? scoreTone(result.trust_score) : "border-sky-400/20 bg-sky-500/5 text-sky-100"}`}>
          <div className="eyebrow text-current/70">{result.score_available ? (result.analysis_type === "solana_mint" ? translate(language, "Điểm rủi ro quyền hạn", "Authority risk score") : translate(language, "Điểm tin cậy", "Trust score")) : translate(language, "Hồ sơ thị trường", "Market profile")}</div>
          {result.score_available ? <div className="mt-2 text-6xl font-semibold tracking-tighter">{result.trust_score}<span className="text-2xl">/100</span></div> : <><div className="mt-3 flex items-center gap-2 text-xl font-semibold"><CircleDollarSign className="h-6 w-6 text-sky-300" />{translate(language, "Đã nhận diện tài sản", "Asset identified")}</div><p className="mt-2 text-sm leading-6 text-slate-300">{translate(language, "Chưa có điểm bảo mật vì chain hoặc source code chưa được scanner hỗ trợ.", "No security score is available because this chain or source code is not yet supported by the scanner.")}</p></>}
          {result.analysis_type === "solana_mint" && <p className="mt-3 text-xs leading-5 text-slate-300">{translate(language, "Điểm này chỉ phản ánh quyền mint/freeze của SPL token; không phải audit toàn bộ Solana program.", "This score only reflects SPL token mint/freeze authority; it is not an audit of the entire Solana program.")}</p>}
          <div className="mt-6 border-t border-current/20 pt-5 text-sm">
            <div className="flex items-center gap-3"><TokenAvatar name={result.name || "Unknown token"} symbol={result.analysis_type === "native_asset" ? result.address : result.name} imageURL={result.image_url} /><div className="font-semibold text-slate-100">{result.name || "Unknown token"}</div></div>
            <div className="mt-1 break-all font-mono text-xs text-slate-400">{result.address}</div>
            <div className="mt-4 flex flex-wrap gap-2"><span className="inline-flex rounded-md border border-slate-700 bg-slate-950/35 px-2 py-1 text-xs font-medium text-slate-300">{result.network || translate(language, "Không rõ network", "Unknown network")}</span><span className="inline-flex rounded-md border border-slate-700 bg-slate-950/35 px-2 py-1 text-xs font-medium text-slate-300">{analysisLabel(language, result.analysis_type)}</span>{result.analyzed_at && <span className="inline-flex rounded-md border border-slate-700 bg-slate-950/35 px-2 py-1 text-xs font-medium text-slate-300">{translate(language, "Phân tích lúc", "Analyzed")} {dateTime(language, result.analyzed_at)}</span>}</div>
            <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3 text-xs leading-5 text-slate-300"><div className="flex items-center gap-2 font-semibold text-amber-100"><Info className="h-4 w-4 shrink-0" /> {translate(language, "Phạm vi kiểm tra", "Inspection scope")}</div><p className="mt-2">{inspectionScope(language, result)}</p>{result.source_available && <p className="mt-2 text-slate-400">{translate(language, "Nguồn code: blockchain explorer của chain tương ứng. Dữ liệu thị trường (nếu có):", "Source code: blockchain explorer for the corresponding chain. Market data (if available):")} {result.market_provider || "DexScreener"}.</p>}{explorerSourceURL(result.network, result.address) && <a href={explorerSourceURL(result.network, result.address)} target="_blank" rel="noreferrer" className="mt-2 inline-flex font-medium text-sky-300 hover:text-sky-200">{translate(language, "Xem source public trên explorer ↗", "View public source on explorer ↗")}</a>}<p className="mt-2 text-slate-400">{translate(language, "Kết quả là tín hiệu tự động, không phải chứng nhận audit hoặc cam kết tài sản an toàn.", "This is an automated signal, not an audit certificate or safety guarantee.")}</p></div>
            {result.analysis_type === "market_asset" && <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-lg border border-sky-400/15 bg-slate-950/35 p-3"><div className="text-xs text-slate-400">{translate(language, "Thanh khoản", "Liquidity")}</div><div className="mt-1 text-sm font-semibold text-slate-100">{usd(language, result.liquidity_usd)}</div></div><div className="rounded-lg border border-sky-400/15 bg-slate-950/35 p-3"><div className="text-xs text-slate-400">{translate(language, "Khối lượng 24h", "24h volume")}</div><div className="mt-1 text-sm font-semibold text-slate-100">{volume24h(language, result.volume_h24)}</div></div></div>}
            {result.analysis_type === "market_asset" && <div className="mt-3 rounded-lg border border-sky-400/15 bg-slate-950/35 p-3 text-xs"><div className="flex items-center justify-between gap-3"><span className="text-slate-400">{translate(language, "Nguồn dữ liệu", "Data source")}</span><span className="font-medium text-slate-200">{result.market_provider || translate(language, "Nhà cung cấp thị trường", "Market provider")} · {result.dex_id || "DEX"}</span></div><div className="mt-2 flex items-center justify-between gap-3"><span className="text-slate-400">{translate(language, "Pair từ", "Pair since")}</span><span className="font-medium text-slate-200">{dateFromUnixMs(language, result.pair_created_at)}</span></div><div className="mt-2 flex items-center justify-between gap-3"><span className="text-slate-400">{translate(language, "Độ tin cậy dữ liệu", "Data confidence")}</span><span className="font-medium text-sky-200">{confidenceLabel(language, result.market_confidence)}</span></div>{result.pair_url && <a href={result.pair_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex font-medium text-sky-300 hover:text-sky-200">{translate(language, "Mở pair trên DexScreener ↗", "Open pair on DexScreener ↗")}</a>}</div>}
          </div>
        </div>
        <div className="surface p-6">
          <div className="flex items-center gap-2 eyebrow"><Sparkles className="h-4 w-4 text-sky-400" /> {translate(language, "Kết quả phân tích", "Analysis results")}</div>
          {result.issues.length > 0 ? <div className="mt-5 space-y-3">{result.issues.map((issue, index) => <div key={`${issue.name}-${index}`} className="rounded-xl border border-slate-800 bg-slate-900/55 p-4"><div className="flex items-start justify-between gap-4"><div><div className="font-medium text-slate-100">{issue.name}</div><p className="mt-1 text-sm leading-6 text-slate-400">{issue.description}</p></div><span className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-300">-{issue.impact}</span></div></div>)}</div> : <div className="mt-5 flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />{translate(language, "Chưa phát hiện cảnh báo rủi ro từ các kiểm tra hiện có.", "No risk warning was found by the available checks.")}</div>}
          {result.safe_features.length > 0 && <div className="mt-6 border-t border-slate-800 pt-5"><div className="eyebrow">{translate(language, "Tín hiệu tích cực", "Positive signals")}</div><div className="mt-3 flex flex-wrap gap-2">{result.safe_features.map((feature) => <span key={feature} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">{feature}</span>)}</div></div>}
        </div>
      </section>}
    </div>
  </main>;
}
