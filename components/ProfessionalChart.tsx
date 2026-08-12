"use client";

import { useEffect, useRef, useState } from 'react';
import { createChart, LineStyle, type ISeriesApi, type IChartApi, type MouseEventParams, type UTCTimestamp } from 'lightweight-charts';
import { BarChart3, Maximize2, Minimize2, Radio, RotateCcw, SlidersHorizontal, ZoomIn, ZoomOut } from 'lucide-react';
import { languageLocale, translate, useLanguage } from '@/context/LanguageContext';
import { zoomLogicalRange } from '@/lib/chart-interactions';

interface ProfessionalChartProps {
    symbol?: string;
    coinName?: string;
}

interface CandleData {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface BinanceKlineEvent {
    k: { t: number; o: string; h: string; l: string; c: string; v: string };
}

interface BinanceTickerEvent {
    h: string;
    l: string;
    v: string;
}

interface BinanceTickerStats {
    highPrice: string;
    lowPrice: string;
    volume: string;
}

const TIMEFRAMES = [
    { label: '5m', value: '5m', limit: 1000, total: 5000 },
    { label: '15m', value: '15m', limit: 1000, total: 3000 },
    { label: '1h', value: '1h', limit: 1000, total: 2000 },
    { label: '4h', value: '4h', limit: 1000, total: 1000 },
    { label: '1d', value: '1d', limit: 1000, total: 1000 },
    { label: '1w', value: '1w', limit: 1000, total: 1000 },
] as const;

function toChartTime(milliseconds: number): UTCTimestamp {
    return (Math.floor(milliseconds / 1000) + 25200) as UTCTimestamp;
}

function isBinanceKline(value: unknown): value is [number, string, string, string, string, string, ...unknown[]] {
    return Array.isArray(value)
        && typeof value[0] === 'number'
        && typeof value[1] === 'string'
        && typeof value[2] === 'string'
        && typeof value[3] === 'string'
        && typeof value[4] === 'string'
        && typeof value[5] === 'string';
}

function isBinanceKlineEvent(value: unknown): value is BinanceKlineEvent {
    if (typeof value !== 'object' || value === null) return false;
    const kline = (value as Record<string, unknown>).k;
    if (typeof kline !== 'object' || kline === null) return false;
    const data = kline as Record<string, unknown>;
    return typeof data.t === 'number' && typeof data.o === 'string' && typeof data.h === 'string' && typeof data.l === 'string' && typeof data.c === 'string' && typeof data.v === 'string';
}

function isBinanceTickerEvent(value: unknown): value is BinanceTickerEvent {
    if (typeof value !== 'object' || value === null) return false;
    const ticker = value as Record<string, unknown>;
    return typeof ticker.h === 'string' && typeof ticker.l === 'string' && typeof ticker.v === 'string';
}

function isBinanceTickerStats(value: unknown): value is BinanceTickerStats {
    if (typeof value !== 'object' || value === null) return false;
    const ticker = value as Record<string, unknown>;
    return typeof ticker.highPrice === 'string' && typeof ticker.lowPrice === 'string' && typeof ticker.volume === 'string';
}

export default function ProfessionalChart({ symbol = "BTCUSDT", coinName }: ProfessionalChartProps) {
    const { language } = useLanguage();
    const locale = languageLocale(language);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const ema7SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const ema25SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const ema99SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

    const [interval, setInterval] = useState<string>('15m');
    const currentPriceRef = useRef<string>("0.00");
    const [currentPrice, _setCurrentPrice] = useState("0.00");
    const setCurrentPrice = (price: string) => {
        currentPriceRef.current = price;
        _setCurrentPrice(price);
    };
    const [priceChange, setPriceChange] = useState<number>(0);

    // Helper to calculate EMA
    const calculateEMA = (data: CandleData[], count: number) => {
        const k = 2 / (count + 1);
        const emaData = [];
        let ema = data.length > 0 ? data[0].close : 0; // Initialize with first close price or 0 if no data

        for (let i = 0; i < data.length; i++) {
            ema = data[i].close * k + ema * (1 - k);
            emaData.push({ time: data[i].time, value: ema });
        }
        return emaData;
    };

    const [stats, setStats] = useState({ high: '0.00', low: '0.00', vol: '0.00' });
    const [cursorData, setCursorData] = useState<{ visible: boolean; x: number; y: number; price: string; percentDiff: string } | null>(null);
    const [chartLoadError, setChartLoadError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [indicatorMenuOpen, setIndicatorMenuOpen] = useState(false);
    const [showVolume, setShowVolume] = useState(true);
    const [showEMA7, setShowEMA7] = useState(true);
    const [showEMA25, setShowEMA25] = useState(true);
    const [showEMA99, setShowEMA99] = useState(true);

    const zoomChart = (multiplier: number) => {
        const timeScale = chartRef.current?.timeScale();
        const nextRange = zoomLogicalRange(timeScale?.getVisibleLogicalRange() ?? null, multiplier);
        if (nextRange) timeScale?.setVisibleLogicalRange(nextRange);
    };

    const resetChartView = () => {
        const timeScale = chartRef.current?.timeScale();
        timeScale?.fitContent();
        timeScale?.scrollToRealTime();
    };

    useEffect(() => {
        const chart = chartRef.current;
        const container = chartContainerRef.current;
        if (!chart || !container) return;

        const previousOverflow = document.body.style.overflow;
        const resizeChart = () => {
            chart.applyOptions({
                width: container.clientWidth,
                height: isFullscreen ? Math.max(window.innerHeight - 220, 360) : 500,
            });
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsFullscreen(false);
        };

        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }
        const frame = window.requestAnimationFrame(resizeChart);
        window.addEventListener('resize', resizeChart);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener('resize', resizeChart);
            window.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = previousOverflow;
        };
    }, [isFullscreen]);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Create chart
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 500,
            layout: {
                background: { color: '#0a0a0a' },
                textColor: '#999',
            },
            grid: {
                vertLines: { color: '#1a1a1a', style: LineStyle.Solid },
                horzLines: { color: '#1a1a1a', style: LineStyle.Solid },
            },
            crosshair: {
                vertLine: {
                    color: '#666',
                    width: 1,
                    style: LineStyle.Solid,
                    labelBackgroundColor: '#333',
                },
                horzLine: {
                    color: '#666',
                    width: 1,
                    style: LineStyle.Solid,
                    labelBackgroundColor: '#333',
                    labelVisible: false, // Disable native label to use custom one
                },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#333',
                lockVisibleTimeRangeOnResize: false,
                fixLeftEdge: false,                   // Allow scrolling left
                fixRightEdge: false,                  // Allow scrolling right
                rightOffset: 12, // Add 12 bars of empty space to the right
            },
            rightPriceScale: {
                borderColor: '#333',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.2, // Leave space for volume
                },
            },
            watermark: {
                visible: false,
            },
            // Match familiar trading-chart interactions: scroll/pinch zooms,
            // while drag/touch pans the timeline.
            handleScale: {
                mouseWheel: true,
                pinch: true,
                axisPressedMouseMove: true,
            },
            handleScroll: {
                mouseWheel: false,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: false,
            },
        });

        chartRef.current = chart;

        // Add candlestick series
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderUpColor: '#26a69a',
            borderDownColor: '#ef5350',
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });
        candlestickSeriesRef.current = candlestickSeries;

        // Volume Series
        const volumeSeries = chart.addHistogramSeries({
            priceScaleId: 'volume',
            priceFormat: { type: 'volume' },
        });
        volumeSeriesRef.current = volumeSeries;

        chart.priceScale('volume').applyOptions({
            scaleMargins: {
                top: 0.85, // Place volume at the bottom 8% (very small)
                bottom: 0,
            },
        });

        // EMA Series
        const ema7 = chart.addLineSeries({
            color: 'rgba(251, 140, 0, 0.5)',
            lineWidth: 1,
            priceScaleId: 'right',
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
        }); // Yellow
        const ema25 = chart.addLineSeries({
            color: 'rgba(41, 98, 255, 0.5)',
            lineWidth: 1,
            priceScaleId: 'right',
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
        }); // Blue
        const ema99 = chart.addLineSeries({
            color: 'rgba(224, 64, 251, 0.5)',
            lineWidth: 1,
            priceScaleId: 'right',
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
        }); // Purple

        ema7SeriesRef.current = ema7;
        ema25SeriesRef.current = ema25;
        ema99SeriesRef.current = ema99;

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        const handleCrosshairMove = (param: MouseEventParams) => {
            // Check if point is valid (remove !param.time check to allow empty space)
            if (
                param.point === undefined ||
                param.point.x < 0 ||
                param.point.x > chartContainerRef.current!.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartContainerRef.current!.clientHeight
            ) {
                setCursorData(null);
                return;
            }

            const price = candlestickSeriesRef.current!.coordinateToPrice(param.point.y);
            if (price !== null) {
                const currentPriceVal = parseFloat(currentPriceRef.current);
                // Fallback to avoid weird display if currentPrice is 0 (initial state)
                if (isNaN(currentPriceVal) || currentPriceVal === 0) {
                    setCursorData({
                        visible: true,
                        x: param.point.x,
                        y: param.point.y,
                        price: price.toFixed(2),
                        percentDiff: '0,00%'
                    });
                    return;
                }

                const diff = ((price - currentPriceVal) / currentPriceVal) * 100;
                setCursorData({
                    visible: true,
                    x: param.point.x,
                    y: param.point.y,
                    price: price.toFixed(2),
                    percentDiff: (diff > 0 ? '+' : '') + diff.toFixed(2).replace('.', ',') + '%'
                });
            } else {
                setCursorData(null);
            }
        };

        chart.subscribeCrosshairMove(handleCrosshairMove);


        return () => {
            window.removeEventListener('resize', handleResize);
            chart.unsubscribeCrosshairMove(handleCrosshairMove);
            chart.remove();
        };
    }, []); // Only run once on mount (technically depends on nothing)

    // Data Fetching
    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        setChartLoadError(false);

        const fetchData = async () => {
            try {
                // Fetch 24h stats
                const statsRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, { signal: controller.signal });
                if (!statsRes.ok) throw new Error(`Binance returned ${statsRes.status}`);
                const statsData: unknown = await statsRes.json();
                if (!isBinanceTickerStats(statsData)) throw new Error('Invalid Binance ticker payload');
                if (!active) return;
                setStats({
                    high: parseFloat(statsData.highPrice).toFixed(2),
                    low: parseFloat(statsData.lowPrice).toFixed(2),
                    vol: parseFloat(statsData.volume).toFixed(2)
                });

                const timeframe = TIMEFRAMES.find(tf => tf.value === interval);
                const limit = timeframe?.limit || 1000;
                const url: string = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

                const response: Response = await fetch(url, { signal: controller.signal });
                if (!response.ok) throw new Error(`Binance returned ${response.status}`);
                const payload: unknown = await response.json();
                const data = Array.isArray(payload) ? payload.filter(isBinanceKline) : [];
                if (!active) return;

                const formattedData: CandleData[] = data.map((item) => ({
                    time: toChartTime(item[0]), // Add 7 hours for UTC+7 (Vietnam)
                    open: parseFloat(item[1]),
                    high: parseFloat(item[2]),
                    low: parseFloat(item[3]),
                    close: parseFloat(item[4]),
                    volume: parseFloat(item[5]),
                }));

                const volumeData = data.map((item) => ({
                    time: toChartTime(item[0]),
                    value: parseFloat(item[5]),
                    color: parseFloat(item[4]) >= parseFloat(item[1]) ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
                }));

                if (candlestickSeriesRef.current && volumeSeriesRef.current) {
                    candlestickSeriesRef.current.setData(formattedData);
                    volumeSeriesRef.current.setData(volumeData);

                    // Set EMA Data
                    if (formattedData.length > 0) {
                        const ema7Data = calculateEMA(formattedData, 7);
                        const ema25Data = calculateEMA(formattedData, 25);
                        const ema99Data = calculateEMA(formattedData, 99);

                        ema7SeriesRef.current?.setData(ema7Data);
                        ema25SeriesRef.current?.setData(ema25Data);
                        ema99SeriesRef.current?.setData(ema99Data);

                        // Add 10 empty candles for future grid
                        const lastTime = formattedData[formattedData.length - 1].time;
                        const intervalSeconds =
                            interval === '5m' ? 300 :
                                interval === '15m' ? 900 :
                                    interval === '1h' ? 3600 :
                                        interval === '4h' ? 14400 :
                                            interval === '1d' ? 86400 : 604800; // 1w

                        for (let i = 1; i <= 10; i++) {
                            candlestickSeriesRef.current.update({ time: (lastTime + (i * intervalSeconds)) as UTCTimestamp });
                        }
                    }
                }

                if (formattedData.length > 0) {
                    const latest = formattedData[formattedData.length - 1];
                    const first = formattedData[0];
                    setCurrentPrice(latest.close.toFixed(2));
                    const change = ((latest.close - first.close) / first.close) * 100;
                    setPriceChange(change);
                }

                if (chartRef.current && formattedData.length > 0) {
                    const visibleCandles = 100;
                    const latestTime = formattedData[formattedData.length - 1].time;
                    const startIndex = Math.max(0, formattedData.length - visibleCandles);
                    const startTime = formattedData[startIndex].time;

                    // Start a new symbol/timeframe at a useful recent range.
                    // Do not force a later scroll position: the member can pan
                    // and zoom freely after this initial load.
                    chartRef.current.timeScale().setVisibleRange({
                        from: startTime,
                        to: latestTime,
                    });
                }
            } catch (error) {
                if ((error as DOMException).name === 'AbortError' || !active) return;
                setChartLoadError(true);
            }
        };

        fetchData();

        // Setup WebSocket for kline updates
        const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            if (document.visibilityState !== "visible") return;
            const message: unknown = JSON.parse(event.data);
            if (!isBinanceKlineEvent(message)) return;
            const candle = message.k;

            if (candle && candlestickSeriesRef.current) {
                const newCandle = {
                    time: toChartTime(candle.t),
                    open: parseFloat(candle.o),
                    high: parseFloat(candle.h),
                    low: parseFloat(candle.l),
                    close: parseFloat(candle.c),
                };

                try {
                    candlestickSeriesRef.current.update(newCandle);
                } catch (e) {
                    // Ignore "Cannot update oldest data" errors during race conditions
                    console.warn("Chart update skipped:", e);
                }
                setCurrentPrice(newCandle.close.toFixed(2));

                // Update Volume
                if (volumeSeriesRef.current) {
                    volumeSeriesRef.current.update({
                        time: newCandle.time,
                        value: parseFloat(candle.v),
                        color: newCandle.close >= newCandle.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
                    });
                }

            }
        };

        // Setup WebSocket for 24h ticker updates
        const tickerWsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`;
        const tickerWs = new WebSocket(tickerWsUrl);

        tickerWs.onmessage = (event) => {
            if (document.visibilityState !== "visible") return;
            const ticker: unknown = JSON.parse(event.data);
            if (isBinanceTickerEvent(ticker)) {
                setStats({
                    high: parseFloat(ticker.h).toFixed(2),
                    low: parseFloat(ticker.l).toFixed(2),
                    vol: parseFloat(ticker.v).toFixed(2)
                });
            }
        };

        return () => {
            active = false;
            controller.abort();
            ws.close();
            tickerWs.close();
        };
    }, [symbol, interval, retryKey]);

    const isPositive = priceChange >= 0;

    const formatPrice = (value: string | number) => {
        const val = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(val)) return '0,00';
        return val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div
            className={`relative w-full h-full bg-gradient-to-b from-[#0a0a0a] to-[#050505] p-6 ${isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''}`}
            role="region"
            tabIndex={0}
            aria-label={translate(language, 'Biểu đồ giá tương tác', 'Interactive price chart')}
            aria-describedby="chart-keyboard-help"
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === '+' || event.key === '=') {
                    event.preventDefault();
                    zoomChart(0.7);
                } else if (event.key === '-') {
                    event.preventDefault();
                    zoomChart(1.45);
                } else if (event.key === '0') {
                    event.preventDefault();
                    resetChartView();
                }
            }}
        >
            <span id="chart-keyboard-help" className="sr-only">
                {translate(language, 'Dùng phím cộng hoặc trừ để phóng to, thu nhỏ; nhấn số 0 để về dữ liệu mới nhất.', 'Use plus or minus to zoom; press zero to return to the latest data.')}
            </span>
            {/* Header */}
            <div className="mb-4 space-y-4">
                <div className="min-w-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                    <div>
                        <div className="flex items-baseline gap-3">
                            <span className="inline-block min-w-[9ch] text-right text-4xl font-bold tabular-nums text-white">
                                ${formatPrice(currentPrice)}
                            </span>
                            <span className={`inline-block min-w-[7ch] tabular-nums text-lg font-semibold ${isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                            </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                            {coinName || symbol.replace('USDT', '')} · {symbol.replace('USDT', '')}/USDT
                        </div>
                    </div>

                    {/* 24h Stats */}
                    <div className="flex flex-wrap gap-4 text-sm sm:gap-8">
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs mb-1">{translate(language, "Đỉnh 24h", "24h high")}</span>
                            <span className="min-w-[8ch] font-medium tabular-nums text-gray-200">{formatPrice(stats.high)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs mb-1">{translate(language, "Đáy 24h", "24h low")}</span>
                            <span className="min-w-[8ch] font-medium tabular-nums text-gray-200">{formatPrice(stats.low)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs mb-1">{translate(language, "Khối lượng 24h", "24h volume")}</span>
                            <span className="min-w-[10ch] font-medium tabular-nums text-gray-200">{formatPrice(stats.vol)}</span>
                        </div>
                    </div>
                </div>

                {/* Timeframe Selector */}
                <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3 sm:justify-end">
                    {TIMEFRAMES.map((tf) => (
                        <button
                            key={tf.value}
                            onClick={() => setInterval(tf.value)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-all ${interval === tf.value
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white'
                                }`}
                        >
                            {tf.label}
                        </button>
                    ))}
                    <span className="h-5 w-px bg-white/10" aria-hidden="true" />
                    <button
                        type="button"
                        onClick={() => zoomChart(0.7)}
                        className="rounded bg-[#1a1a1a] p-1.5 text-gray-300 transition-colors hover:bg-[#222] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        aria-label={translate(language, 'Phóng to biểu đồ', 'Zoom in chart')}
                        title={translate(language, 'Phóng to', 'Zoom in')}
                    >
                        <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => zoomChart(1.45)}
                        className="rounded bg-[#1a1a1a] p-1.5 text-gray-300 transition-colors hover:bg-[#222] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        aria-label={translate(language, 'Thu nhỏ biểu đồ', 'Zoom out chart')}
                        title={translate(language, 'Thu nhỏ', 'Zoom out')}
                    >
                        <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={resetChartView}
                        className="inline-flex items-center gap-1 rounded bg-[#1a1a1a] px-2 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-[#222] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        aria-label={translate(language, 'Khôi phục khung nhìn biểu đồ', 'Reset chart view')}
                        title={translate(language, 'Về dữ liệu mới nhất', 'Fit latest data')}
                    >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        <Radio className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                        <span>{translate(language, 'Mới nhất', 'Latest')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsFullscreen((current) => !current)}
                        className="rounded bg-[#1a1a1a] p-1.5 text-gray-300 transition-colors hover:bg-[#222] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        aria-pressed={isFullscreen}
                        aria-label={translate(language, isFullscreen ? 'Thoát chế độ toàn màn hình biểu đồ' : 'Mở rộng biểu đồ toàn màn hình', isFullscreen ? 'Exit chart fullscreen' : 'Expand chart fullscreen')}
                        title={translate(language, isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Mở rộng toàn màn hình', isFullscreen ? 'Exit fullscreen (Esc)' : 'Expand fullscreen')}
                    >
                        {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />}
                    </button>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIndicatorMenuOpen((current) => !current)}
                            className="rounded bg-[#1a1a1a] p-1.5 text-gray-300 transition-colors hover:bg-[#222] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            aria-expanded={indicatorMenuOpen}
                            aria-controls="chart-indicators"
                            aria-label={translate(language, 'Tùy chỉnh chỉ báo biểu đồ', 'Customize chart indicators')}
                            title={translate(language, 'Chỉ báo', 'Indicators')}
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        {indicatorMenuOpen && <div id="chart-indicators" className="absolute right-0 z-30 mt-2 w-44 rounded-lg border border-white/10 bg-[#101010] p-2 shadow-xl shadow-black/40">
                            <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{translate(language, 'Chỉ báo', 'Indicators')}</p>
                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-1.5 text-xs text-slate-200 hover:bg-white/5"><span className="inline-flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{translate(language, 'Khối lượng', 'Volume')}</span><input type="checkbox" checked={showVolume} onChange={(event) => { const visible = event.target.checked; setShowVolume(visible); volumeSeriesRef.current?.applyOptions({ visible }); }} /></label>
                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-1.5 text-xs text-slate-200 hover:bg-white/5"><span className="text-orange-300">EMA 7</span><input type="checkbox" checked={showEMA7} onChange={(event) => { const visible = event.target.checked; setShowEMA7(visible); ema7SeriesRef.current?.applyOptions({ visible }); }} /></label>
                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-1.5 text-xs text-slate-200 hover:bg-white/5"><span className="text-blue-300">EMA 25</span><input type="checkbox" checked={showEMA25} onChange={(event) => { const visible = event.target.checked; setShowEMA25(visible); ema25SeriesRef.current?.applyOptions({ visible }); }} /></label>
                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-1.5 text-xs text-slate-200 hover:bg-white/5"><span className="text-fuchsia-300">EMA 99</span><input type="checkbox" checked={showEMA99} onChange={(event) => { const visible = event.target.checked; setShowEMA99(visible); ema99SeriesRef.current?.applyOptions({ visible }); }} /></label>
                        </div>}
                    </div>
                </div>
            </div>

            {/* Tooltip removed to prevent blocking candles */}

            {/* Custom Right Scale Label (Axis) */}
            {cursorData && cursorData.visible && (
                <div
                    className="absolute z-40 pointer-events-none bg-[#333] text-white text-[11px] font-mono px-1 flex items-center justify-center border-l-2 border-white/20"
                    style={{
                        right: 0,
                        top: cursorData.y + 95, // Direct centering: y - half_height
                        height: '20px',
                        minWidth: '60px',
                    }}
                >
                    {formatPrice(cursorData.price)} ({cursorData.percentDiff})
                </div>
            )}

            {/* Chart */}
            <style jsx global>{`
                /* Hide TradingView watermark and attribution */
                .tv-lightweight-charts > table > tr:nth-child(2) > td:nth-child(2) > a {
                    display: none !important;
                }
                .tv-lightweight-charts > div:last-child {
                    display: none !important;
                }
                a[href^="https://www.tradingview.com/"] {
                    display: none !important;
                }
                /* Additional backup selectors */
                div[style*="z-index: 3"] > a[href*="tradingview"] {
                    display: none !important;
                }
                .tv-lightweight-charts__watermark {
                    display: none !important;
                }
            `}</style>
            {chartLoadError && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"><span>{translate(language, "Không tải được dữ liệu biểu đồ mới nhất. Dữ liệu cũ (nếu có) vẫn có thể được hiển thị.", "The latest chart data could not be loaded. Older data, if available, may still be shown.")}</span><button type="button" onClick={() => setRetryKey((value) => value + 1)} className="rounded-md border border-amber-200/25 px-2.5 py-1 text-xs font-semibold hover:bg-amber-500/15">{translate(language, "Thử lại", "Retry")}</button></div>}
            <div ref={chartContainerRef} className="w-full" />

            {/* Legend removed - MA lines disabled */}
        </div>
    );
}
