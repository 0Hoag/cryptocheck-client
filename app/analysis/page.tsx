"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import CoinList from "@/components/CoinList";
import axios from "axios";
import { languageLocale, translate, useLanguage } from "@/context/LanguageContext";

function ChartLoading() {
    const { language } = useLanguage();
    return <div role="status" className="h-[540px] animate-pulse rounded-2xl border border-slate-800 bg-slate-950/60"><span className="sr-only">{translate(language, "Đang tải biểu đồ thị trường", "Loading market chart")}</span></div>;
}

const ProfessionalChart = dynamic(() => import("@/components/ProfessionalChart"), {
    ssr: false,
    loading: () => <ChartLoading />,
});

type OrderBookRow = { price: string; amount: string; total: string; fill: number };
type DepthMessage = { asks: [string, string][]; bids: [string, string][] };

export default function AnalysisPage() {
    const { language } = useLanguage();
    const locale = languageLocale(language);
    const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
    const [selectedCoinName, setSelectedCoinName] = useState("Bitcoin");
    const [currentPrice, setCurrentPrice] = useState(82695.50);
    const [orderBook, setOrderBook] = useState<{ bids: OrderBookRow[]; asks: OrderBookRow[] }>({ bids: [], asks: [] });
    const [orderBookSymbol, setOrderBookSymbol] = useState("BTCUSDT");
    const [orderBookState, setOrderBookState] = useState<"loading" | "ready" | "error" | "unsupported">("loading");

    // Helper to format large numbers
    const formatTotal = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toFixed(2);
    };

    // Fetch current price and Order Book via WebSocket
    useEffect(() => {
        let active = true;
        // Initial price fetch
        const fetchPrice = async () => {
            // ... existing axios logic if needed, but WS handles it better
            try {
                if (selectedSymbol === "XAUUSD") {
                    setCurrentPrice(2650.00);
                    return;
                }
                const res = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${selectedSymbol}`);
                if (active) setCurrentPrice(parseFloat(res.data.price));
            } catch {
                if (active) setOrderBookState("error");
            }
        };
        fetchPrice();

        // WebSocket for Order Book
        if (selectedSymbol !== "XAUUSD") {
            const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@depth20@1000ms`);

            ws.onmessage = (event) => {
                if (document.visibilityState !== "visible") return;
                const data = JSON.parse(event.data) as DepthMessage;
                const asks = data.asks.map((ask) => ({
                    price: parseFloat(ask[0]).toFixed(2),
                    amount: parseFloat(ask[1]).toFixed(4),
                    total: formatTotal(parseFloat(ask[0]) * parseFloat(ask[1])),
                    fill: Math.min(100, parseFloat(ask[1]) * 100), // Simple visual depth
                })).reverse().slice(0, 15); // Show top 15

                const bids = data.bids.map((bid) => ({
                    price: parseFloat(bid[0]).toFixed(2),
                    amount: parseFloat(bid[1]).toFixed(4),
                    total: formatTotal(parseFloat(bid[0]) * parseFloat(bid[1])),
                    fill: Math.min(100, parseFloat(bid[1]) * 100),
                })).slice(0, 15);

                if (active) {
                    setOrderBook({ asks, bids });
                    setOrderBookSymbol(selectedSymbol);
                    setOrderBookState("ready");
                }
            };

            ws.onerror = () => {
                if (active) setOrderBookState("error");
            };

            return () => {
                active = false;
                ws.close();
            };
        }

        return () => { active = false; };
    }, [selectedSymbol]);

    const visibleOrderBook = orderBookSymbol === selectedSymbol ? orderBook : { bids: [], asks: [] };
    const visibleOrderBookState = selectedSymbol === "XAUUSD" ? "unsupported" : orderBookSymbol === selectedSymbol ? orderBookState : "loading";
    const orderBookMessage = visibleOrderBookState === "unsupported"
        ? translate(language, "Thị trường này chưa có sổ lệnh trực tiếp.", "This market does not have a live order book yet.")
        : visibleOrderBookState === "error"
            ? translate(language, "Không thể tải sổ lệnh. Vui lòng thử lại sau.", "Could not load the order book. Please try again later.")
            : translate(language, "Đang tải…", "Loading…");

    return (
        <main className="min-h-screen bg-[#050505] text-gray-200 p-4">
            <div className="mx-auto grid max-w-[1920px] grid-cols-1 gap-4 lg:grid-cols-12 lg:h-[calc(100vh-140px)]">

                {/* LEFT: Order Book (Real-time) */}
                <div className="hidden lg:block lg:col-span-2 xl:col-span-2 bg-[#111] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{translate(language, "Sổ lệnh", "Order book")}</h3>
                        <span className="text-[10px] text-gray-600">{selectedSymbol.replace('USDT', '')}/USDT</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar text-[10px] font-mono">
                        <div className="sticky top-0 bg-[#111] grid grid-cols-3 px-3 py-2 text-gray-500 font-bold border-b border-white/5 z-10">
                            <span>{translate(language, "Giá", "Price")}</span>
                            <span className="text-right">{translate(language, "Khối lượng", "Amount")}</span>
                            <span className="text-right">{translate(language, "Tổng", "Total")}</span>
                        </div>

                        {/* Asks (Sell) */}
                        <div className="py-1">
                            {visibleOrderBook.asks.length > 0 ? visibleOrderBook.asks.map((ask, i) => (
                                <div key={i} className="grid grid-cols-3 px-3 py-0.5 hover:bg-white/5 relative group cursor-pointer">
                                    <span className="text-red-400 z-10">{ask.price}</span>
                                    <span className="text-right text-gray-300 z-10">{ask.amount}</span>
                                    <span className="text-right text-gray-500 z-10">{ask.total}</span>
                                    {/* Valid visual depth bar */}
                                    <div className="absolute top-0 right-0 bottom-0 bg-red-500/10 transition-all duration-300" style={{ width: `${ask.fill}%` }}></div>
                                </div>
                            )) : (
                                <div className="text-center py-4 text-gray-600 px-3">{orderBookMessage}</div>
                            )}
                        </div>

                        <div className="px-3 py-2 text-center text-lg font-bold text-white border-y border-white/5 bg-white/5 my-1">
                            {currentPrice.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-[10px] text-gray-400 ml-2 font-normal">${currentPrice.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        {/* Bids (Buy) */}
                        <div className="py-1">
                            {visibleOrderBook.bids.length > 0 ? visibleOrderBook.bids.map((bid, i) => (
                                <div key={i} className="grid grid-cols-3 px-3 py-0.5 hover:bg-white/5 relative group cursor-pointer">
                                    <span className="text-green-400 z-10">{bid.price}</span>
                                    <span className="text-right text-gray-300 z-10">{bid.amount}</span>
                                    <span className="text-right text-gray-500 z-10">{bid.total}</span>
                                    <div className="absolute top-0 right-0 bottom-0 bg-green-500/10 transition-all duration-300" style={{ width: `${bid.fill}%` }}></div>
                                </div>
                            )) : (
                                <div className="text-center py-4 text-gray-600 px-3">{orderBookMessage}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MIDDLE: Chart */}
                <div className="col-span-1 lg:col-span-7 xl:col-span-8 bg-[#111] border border-white/5 rounded-2xl overflow-hidden relative">
                    <ProfessionalChart symbol={selectedSymbol} coinName={selectedCoinName} />
                </div>

                {/* Mobile keeps asset selection usable instead of hiding it with the desktop sidebar. */}
                <div className="h-72 lg:hidden">
                    <CoinList
                        selectedSymbol={selectedSymbol}
                        onCoinSelect={(symbol, name) => {
                            setSelectedSymbol(symbol);
                            setSelectedCoinName(name);
                        }}
                    />
                </div>

                {/* RIGHT: Coin List (Clickable) */}
                <div className="hidden lg:block lg:col-span-3 xl:col-span-2 h-full overflow-hidden">
                    <CoinList
                        selectedSymbol={selectedSymbol}
                        onCoinSelect={(symbol, name) => {
                            setSelectedSymbol(symbol);
                            setSelectedCoinName(name);
                        }}
                    />
                </div>
            </div>
        </main>
    );
}
