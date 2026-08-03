"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { languageLocale, translate, useLanguage } from "@/context/LanguageContext";
import { useElementVisibility } from "@/lib/useElementVisibility";

interface CoinData {
    rank: number;
    symbol: string;
    price: number;
    change: number;
}

interface BinanceTicker24h {
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
}

function isBinanceTicker24h(value: unknown): value is BinanceTicker24h {
    if (typeof value !== "object" || value === null) return false;
    const ticker = value as Record<string, unknown>;
    return typeof ticker.symbol === "string" && typeof ticker.lastPrice === "string" && typeof ticker.priceChangePercent === "string";
}

const trackedSymbols = ["BTC", "ETH", "BNB", "XRP", "SOL", "TRX", "DOGE", "ADA", "BCH", "LINK"];

export default function CryptoRanking() {
    const { language } = useLanguage();
    const [coins, setCoins] = useState<CoinData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const { ref: rankingRef, isVisible } = useElementVisibility<HTMLDivElement>();

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | undefined;
        let controller: AbortController | undefined;
        let active = true;

        const fetchPrices = async () => {
            controller?.abort();
            controller = new AbortController();

            try {
                const symbols = trackedSymbols.map((symbol) => `${symbol}USDT`);
                const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`, { signal: controller.signal });
                if (!res.ok) throw new Error(`Binance returned ${res.status}`);
                const payload: unknown = await res.json();
                const data = Array.isArray(payload) ? payload.filter(isBinanceTicker24h) : [];

                const updatedCoins = trackedSymbols.map((sym, index) => {
                    const ticker = data.find((item) => item.symbol === `${sym}USDT`);
                    return {
                        rank: index + 1,
                        symbol: sym,
                        price: ticker ? parseFloat(ticker.lastPrice) : 0,
                        change: ticker ? parseFloat(ticker.priceChangePercent) : 0,
                    };
                });

                if (!active) return;
                setCoins(updatedCoins);
                setError(false);
                setLoading(false);
            } catch (error) {
                if ((error as DOMException).name === "AbortError" || !active) return;
                console.error("Failed to fetch crypto ranking:", error);
                setError(true);
                setLoading(false);
            }
        };

        const startPolling = () => {
            if (document.visibilityState !== "visible" || !isVisible) return;
            void fetchPrices();
            intervalId = setInterval(fetchPrices, 60000);
        };

        const handleVisibilityChange = () => {
            if (intervalId) clearInterval(intervalId);
            intervalId = undefined;
            if (document.visibilityState === "visible" && isVisible) startPolling();
            else controller?.abort();
        };

        startPolling();
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            active = false;
            if (intervalId) clearInterval(intervalId);
            controller?.abort();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isVisible, refreshKey]);

    if (loading) {
        return (
            <div ref={rankingRef} className="bg-[#111] border border-white/5 rounded-2xl p-5 min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return <div ref={rankingRef} className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#111] p-5 text-center"><p className="text-sm text-slate-400">{translate(language, "Không tải được bảng giá crypto.", "Could not load the crypto ranking.")}</p><button type="button" onClick={() => { setLoading(true); setRefreshKey((key) => key + 1); }} className="mt-3 rounded-lg border border-sky-400/30 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-500/10">{translate(language, "Thử lại", "Retry")}</button></div>;
    }

    return (
        <div ref={rankingRef} className="bg-[#111] border border-white/5 rounded-2xl p-5">
            <h3 className="text-gray-400 text-xs font-bold tracking-wider uppercase mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-600"></span> {translate(language, "Top 10 crypto", "Top 10 crypto")}
            </h3>

            <div className="space-y-4">
                {coins.map((coin) => (
                    <div key={coin.symbol} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-600 text-xs font-mono w-4">{coin.rank}</span>
                            <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-800">
                                <Image
                                    src={`https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`}
                                    alt={coin.symbol}
                                    fill
                                    sizes="24px"
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                            <span className="text-gray-300 font-bold text-xs group-hover:text-white transition-colors">
                                {coin.symbol}
                            </span>
                        </div>

                        <div className="text-right">
                            <div className="text-white text-xs font-medium">
                                ${coin.price.toLocaleString(languageLocale(language), { minimumFractionDigits: 2, maximumFractionDigits: coin.price < 1 ? 4 : 2 })}
                            </div>
                            <div className={`text-[10px] flex items-center justify-end gap-1 ${coin.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
