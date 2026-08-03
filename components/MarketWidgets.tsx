"use client";

import { TrendingDown, Activity, Calendar, Wallet, Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { translate, useLanguage } from "@/context/LanguageContext";

interface FNGData {
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update: string;
}

type CalendarEvent = {
    titleVi: string;
    titleEn: string;
    timeVi: string;
    timeEn: string;
    importance: "high" | "medium";
    forecast: string;
    previous: string;
};

function fearGreedLabel(value: string, language: "vi" | "en") {
    const labels: Record<string, [string, string]> = {
        "Extreme Fear": ["Cực kỳ sợ hãi", "Extreme fear"],
        Fear: ["Sợ hãi", "Fear"],
        Neutral: ["Trung lập", "Neutral"],
        Greed: ["Tham lam", "Greed"],
        "Extreme Greed": ["Cực kỳ tham lam", "Extreme greed"],
    };
    const label = labels[value];
    return label ? label[language === "vi" ? 0 : 1] : value;
}

export default function MarketWidgets() {
    const { language } = useLanguage();
    const [fng, setFng] = useState<FNGData | null>(null);
    const [loadingFng, setLoadingFng] = useState(true);
    const [fngError, setFngError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        const fetchFNG = async () => {
            setLoadingFng(true);
            setFngError(false);
            try {
                const res = await fetch("https://api.alternative.me/fng/", { signal: controller.signal });
                if (!res.ok) throw new Error(`Fear & Greed provider returned ${res.status}`);
                const data: unknown = await res.json();
                const payload = data as { data?: unknown };
                if (Array.isArray(payload.data) && payload.data.length > 0 && typeof payload.data[0] === "object" && payload.data[0] !== null) {
                    if (!active) return;
                    setFng(payload.data[0] as FNGData);
                } else {
                    throw new Error("Invalid Fear & Greed provider response");
                }
            } catch (error) {
                if ((error as DOMException).name === "AbortError" || !active) return;
                console.error("Failed to fetch Fear & Greed Index:", error);
                setFngError(true);
            } finally {
                if (active) setLoadingFng(false);
            }
        };

        void fetchFNG();
        return () => {
            active = false;
            controller.abort();
        };
    }, [retryKey]);

    // Simulated Calendar Events (Static for demo purposes but formatted to look live)
    const events: CalendarEvent[] = [
        { titleVi: "Lạm phát cơ bản Mỹ theo năm", titleEn: "US Core Inflation Rate YoY", timeVi: "1 giờ 15 phút", timeEn: "1h 15m", importance: "high", forecast: "3.2%", previous: "3.1%" },
        { titleVi: "Quyết định lãi suất Fed", titleEn: "Fed Interest Rate Decision", timeVi: "Ngày mai", timeEn: "Tomorrow", importance: "high", forecast: "5.50%", previous: "5.50%" },
        { titleVi: "Đơn xin trợ cấp thất nghiệp lần đầu", titleEn: "Initial Jobless Claims", timeVi: "2 giờ 30 phút", timeEn: "2h 30m", importance: "medium", forecast: "215K", previous: "212K" },
    ];

    const getFngColor = (value: number) => {
        if (value >= 75) return "text-green-500"; // Extreme Greed
        if (value >= 55) return "text-green-400"; // Greed
        if (value >= 45) return "text-yellow-400"; // Neutral
        if (value >= 25) return "text-orange-400"; // Fear
        return "text-red-500"; // Extreme Fear
    };

    const getFngPosition = (value: number) => {
        // Ensure 0-100 maps correctly to 0%-100% of the bar
        return Math.min(Math.max(value, 0), 100);
    };

    return (
        <div className="space-y-6">
            {/* Sentiment Widget (Fear & Greed) */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-400 text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                        <Activity className="w-3 h-3" /> {translate(language, "Tâm lý thị trường", "Market sentiment")}
                    </h3>
                </div>

                {loadingFng ? (
                    <div className="h-32 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                    </div>
                ) : fng ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <div className="text-gray-500 text-[10px] uppercase font-bold mb-1">{translate(language, "Chỉ số sợ hãi & tham lam", "Fear & Greed index")}</div>
                                <div className={`text-2xl font-bold ${getFngColor(parseInt(fng.value))}`}>
                                    {fng.value}
                                </div>
                            </div>
                            <div className={`text-xs font-bold px-2 py-1 rounded bg-white/5 ${getFngColor(parseInt(fng.value))}`}>
                                {fearGreedLabel(fng.value_classification, language)}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden flex relative mt-2">
                            {/* Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-yellow-400 to-green-500 opacity-80" />

                            {/* Indicator Dot */}
                            <div
                                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10 transition-all duration-1000 ease-out"
                                style={{ left: `${getFngPosition(parseInt(fng.value))}%` }}
                            />
                        </div>

                        <div className="flex justify-between text-[10px] font-medium text-gray-500 pt-1">
                            <span>{translate(language, "Cực sợ hãi 0", "Extreme fear 0")}</span>
                            <span>{translate(language, "100 Cực tham lam", "100 Extreme greed")}</span>
                        </div>
                    </div>
                ) : (
                    <div role="alert" className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400"><span>{translate(language, "Không tải được dữ liệu tâm lý thị trường.", "Market sentiment data could not be loaded.")}</span>{fngError && <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="rounded-md border border-slate-700 px-2 py-1 font-semibold text-sky-300 hover:bg-slate-900">{translate(language, "Thử lại", "Retry")}</button>}</div>
                )}
            </div>

            {/* Economic Calendar Widget */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-400 text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> {translate(language, "Lịch kinh tế", "Economic calendar")}
                    </h3>
                    <span className="text-[10px] text-slate-500">{translate(language, "Dữ liệu minh hoạ", "Demo data")}</span>
                </div>

                <div className="space-y-4">
                    {events.map((event, index) => (
                        <div key={index} className="flex gap-3 group">
                            <div className="mt-1">
                                <span className={`block w-2 h-2 rounded-full shadow-sm ${event.importance === 'high' ? 'bg-red-500 shadow-red-500/50' : 'bg-blue-500 shadow-blue-500/50'}`}></span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-gray-200 text-xs font-medium leading-tight group-hover:text-white transition-colors">
                                        {language === "vi" ? event.titleVi : event.titleEn}
                                    </h4>
                                    <span className="text-gray-500 text-[10px] whitespace-nowrap ml-2 bg-gray-800/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" /> {language === "vi" ? event.timeVi : event.timeEn}
                                    </span>
                                </div>
                                <div className="flex gap-3 mt-1.5 text-[10px] text-gray-500">
                                    <span className="text-gray-400">{translate(language, "Dự báo", "Forecast")}: {event.forecast}</span>
                                    <span>{translate(language, "Trước đó", "Previous")}: {event.previous}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* On-Chain Flows Widget */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-400 text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                        <Wallet className="w-3 h-3" /> {translate(language, "Dòng tiền on-chain", "On-chain flows")}
                    </h3>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                            <TrendingDown className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-white text-xs font-medium">{translate(language, "Dòng tiền rút khỏi sàn", "Exchange outflow")}</div>
                            <div className="text-green-400 text-[10px] font-bold">-45,200 BTC <span className="text-gray-500 font-normal">(24h)</span></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                            <Activity className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-white text-xs font-medium">{translate(language, "Cảnh báo cá voi", "Whale alert")}</div>
                            <div className="text-blue-400 text-[10px] font-bold">12,000 ETH <span className="text-gray-500 font-normal">{translate(language, "đã dịch chuyển", "moved")}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
