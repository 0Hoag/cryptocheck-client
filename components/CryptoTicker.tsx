"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Activity } from "lucide-react";
import { useLanguage, languageLocale, translate } from "@/context/LanguageContext";

interface CryptoPrice {
    symbol: string;
    price: string;
    percentChange: number;
}

const trackedSymbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "TRXUSDT"];

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

export default function CryptoTicker() {
    const { language } = useLanguage();
    const [prices, setPrices] = useState<CryptoPrice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | undefined;
        let controller: AbortController | undefined;
        let active = true;

        const fetchPrices = async () => {
            controller?.abort();
            controller = new AbortController();

            try {
                // Request only the symbols rendered in this global component.
                // The unfiltered endpoint returns every Binance ticker (~hundreds of KB)
                // and was being downloaded every 10 seconds on every route.
                const requestedSymbols = encodeURIComponent(JSON.stringify(trackedSymbols));
                const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${requestedSymbols}`, { signal: controller.signal });
                if (!res.ok) throw new Error(`Binance returned ${res.status}`);
                const payload: unknown = await res.json();
                const data = Array.isArray(payload) ? payload.filter(isBinanceTicker24h) : [];

                const filtered = data
                    .filter((item) => trackedSymbols.includes(item.symbol))
                    .map((item) => ({
                        symbol: item.symbol.replace("USDT", ""),
                        price: parseFloat(item.lastPrice).toLocaleString(languageLocale(language), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        percentChange: parseFloat(item.priceChangePercent),
                    }));

                // Sort by specified order
                const sorted = filtered.sort((a: CryptoPrice, b: CryptoPrice) =>
                    trackedSymbols.indexOf(a.symbol + "USDT") - trackedSymbols.indexOf(b.symbol + "USDT")
                );

                if (!active) return;
                setPrices(sorted);
                setLoading(false);
            } catch (error) {
                if ((error as DOMException).name === "AbortError" || !active) return;
                console.error("Failed to fetch crypto prices:", error);
                setLoading(false);
            }
        };

        const startPolling = () => {
            if (document.visibilityState !== "visible") return;
            void fetchPrices();
            intervalId = setInterval(fetchPrices, 60000);
        };

        const handleVisibilityChange = () => {
            if (intervalId) clearInterval(intervalId);
            intervalId = undefined;
            if (document.visibilityState === "visible") startPolling();
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
    }, [language]);

    if (loading) return null;

    const marqueePrices = [...prices, ...prices];

    return (
        <div className="w-full bg-[#0a0a0a] border-b border-white/5 overflow-hidden py-2 flex items-center relative z-40">
            <div className="flex items-center gap-2 px-4 border-r border-white/10 shrink-0 bg-[#0a0a0a] z-10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Activity className="w-3 h-3 text-cyan-500" />
                {translate(language, "Thị trường trực tiếp", "Live market")}
            </div>

            {/* Ticker Container */}
            <div className="overflow-hidden whitespace-nowrap mask-linear-gradient w-full flex">
                <div className="flex items-center gap-8 animate-marquee shrink-0 pr-8">
                    {marqueePrices.map((coin, index) => (
                        <div key={`orig-${coin.symbol}-${index}`} className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-gray-300">{coin.symbol}</span>
                            <span className="text-gray-400">${coin.price}</span>
                            <span className={`flex items-center ${coin.percentChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {coin.percentChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {Math.abs(coin.percentChange).toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
                {/* Second duplicated container for seamless loop */}
                <div className="flex items-center gap-8 animate-marquee shrink-0 pr-8" aria-hidden="true">
                    {marqueePrices.map((coin, index) => (
                        <div key={`copy-${coin.symbol}-${index}`} className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-gray-300">{coin.symbol}</span>
                            <span className="text-gray-400">${coin.price}</span>
                            <span className={`flex items-center ${coin.percentChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {coin.percentChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {Math.abs(coin.percentChange).toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
