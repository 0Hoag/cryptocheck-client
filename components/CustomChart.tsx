"use client";

import { useEffect, useState, useRef } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ReferenceLine, CartesianGrid } from 'recharts';

interface CustomChartProps {
    symbol?: string;
}

interface CandleData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timestamp: number;
    ma7?: number;
    ma25?: number;
}

interface CandleStickProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    payload?: CandleData;
}

interface BinanceKlineEvent {
    k: {
        t: number;
        o: string;
        h: string;
        l: string;
        c: string;
        v: string;
    };
}

const TIMEFRAMES = [
    { label: '5m', value: '5m', limit: 100 },
    { label: '15m', value: '15m', limit: 100 },
    { label: '1h', value: '1h', limit: 168 },
    { label: '4h', value: '4h', limit: 168 },
    { label: '1d', value: '1d', limit: 90 },
    { label: '1w', value: '1w', limit: 52 },
] as const;

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
    return typeof data.t === 'number'
        && typeof data.o === 'string'
        && typeof data.h === 'string'
        && typeof data.l === 'string'
        && typeof data.c === 'string'
        && typeof data.v === 'string';
}

function CandleStick({ x = 0, y = 0, width = 0, height = 0, payload }: CandleStickProps) {
    if (!payload || !Number.isFinite(payload.open) || !Number.isFinite(payload.close) || !Number.isFinite(payload.high) || !Number.isFinite(payload.low)) return null;

    const { open, close, high, low } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#26a69a' : '#ef5350';
    const range = high - low;
    if (range === 0) return null;

    const priceToPixel = height / range;
    const wickX = x + width / 2;
    const bodyTop = y + (high - Math.max(open, close)) * priceToPixel;
    const bodyHeight = Math.abs(close - open) * priceToPixel;

    return (
        <g>
            <line x1={wickX} y1={y} x2={wickX} y2={y + height} stroke={color} strokeWidth={1} />
            <rect x={x + 1} y={bodyTop} width={Math.max(width - 2, 1)} height={Math.max(bodyHeight, 1)} fill={color} stroke={color} strokeWidth={0.5} />
        </g>
    );
}

export default function CustomChart({ symbol = "BTCUSDT" }: CustomChartProps) {
    const [chartData, setChartData] = useState<CandleData[]>([]);
    const [currentPrice, setCurrentPrice] = useState<string>('0');
    const [priceChange, setPriceChange] = useState<number>(0);
    const [interval, setInterval] = useState<string>('5m');

    // Pan state
    const [isPanning, setIsPanning] = useState(false);
    const [startX, setStartX] = useState(0);
    const [dataWindow, setDataWindow] = useState({ start: 0, end: 50 });
    const chartRef = useRef<HTMLDivElement>(null);

    // Calculate Moving Averages
    const calculateMA = (data: CandleData[], period: number): CandleData[] => {
        return data.map((item, index) => {
            if (index < period - 1) return item;

            const sum = data.slice(index - period + 1, index + 1)
                .reduce((acc, curr) => acc + curr.close, 0);
            const ma = sum / period;

            if (period === 7) {
                return { ...item, ma7: ma };
            } else if (period === 25) {
                return { ...item, ma25: ma };
            }
            return item;
        });
    };

    useEffect(() => {
        const currentTimeframe = TIMEFRAMES.find(tf => tf.value === interval);
        const limit = currentTimeframe?.limit || 100;

        // Fetch historical candlestick data
        const fetchData = async () => {
            try {
                const response = await fetch(
                    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
                );
                if (!response.ok) throw new Error(`Binance returned ${response.status}`);
                const payload: unknown = await response.json();
                const data = Array.isArray(payload) ? payload.filter(isBinanceKline) : [];

                let formattedData: CandleData[] = data.map((d) => ({
                    time: new Date(d[0]).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        ...(interval === '1d' || interval === '1w' ? { month: 'short', day: 'numeric' } : {})
                    }),
                    timestamp: d[0],
                    open: parseFloat(d[1]),
                    high: parseFloat(d[2]),
                    low: parseFloat(d[3]),
                    close: parseFloat(d[4]),
                    volume: parseFloat(d[5]),
                }));

                // Calculate MAs
                formattedData = calculateMA(formattedData, 7);
                formattedData = calculateMA(formattedData, 25);

                setChartData(formattedData);

                // Update data window to show last 50 candles
                setDataWindow({
                    start: Math.max(0, formattedData.length - 50),
                    end: formattedData.length
                });

                if (formattedData.length > 0) {
                    const latestCandle = formattedData[formattedData.length - 1];
                    const firstCandle = formattedData[0];
                    setCurrentPrice(latestCandle.close.toFixed(2));
                    setPriceChange(((latestCandle.close - firstCandle.open) / firstCandle.open) * 100);
                }
            } catch (error) {
                console.error('Failed to fetch chart data:', error);
            }
        };

        fetchData();

        // WebSocket for real-time updates
        const wsSymbol = symbol.toLowerCase();
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${wsSymbol}@kline_${interval}`);

        ws.onmessage = (event) => {
            if (document.visibilityState !== "visible") return;
            const message: unknown = JSON.parse(event.data);
            if (!isBinanceKlineEvent(message)) return;
            const kline = message.k;

            const newCandle: CandleData = {
                time: new Date(kline.t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                timestamp: kline.t,
                open: parseFloat(kline.o),
                high: parseFloat(kline.h),
                low: parseFloat(kline.l),
                close: parseFloat(kline.c),
                volume: parseFloat(kline.v),
            };

            setCurrentPrice(newCandle.close.toFixed(2));

            setChartData((prev) => {
                let updated = [...prev];
                const lastCandle = updated[updated.length - 1];

                // Update last candle if same timestamp, otherwise add new
                if (lastCandle && lastCandle.timestamp === newCandle.timestamp) {
                    updated[updated.length - 1] = newCandle;
                } else {
                    updated.push(newCandle);
                }

                updated = updated.slice(-limit); // Keep last 'limit' candles

                // Recalculate MAs
                updated = calculateMA(updated, 7);
                updated = calculateMA(updated, 25);

                return updated;
            });
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            ws.close();
        };
    }, [symbol, interval]);

    // Pan handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsPanning(true);
        setStartX(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning) return;

        const deltaX = e.clientX - startX;
        const sensitivity = 0.3; // Reduced for more controlled, precise panning
        const shift = Math.round(deltaX * sensitivity);

        if (Math.abs(shift) > 0) {
            // Use requestAnimationFrame for smooth updates
            requestAnimationFrame(() => {
                setDataWindow(prev => {
                    const windowSize = prev.end - prev.start;
                    let newStart = prev.start - shift;

                    // Allow panning through all data without strict limits
                    // Only prevent going beyond available data
                    if (newStart < 0) newStart = 0;
                    if (newStart + windowSize > chartData.length) {
                        newStart = chartData.length - windowSize;
                    }
                    const newEnd = newStart + windowSize;

                    return { start: newStart, end: newEnd };
                });
            });
            setStartX(e.clientX);
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const handleMouseLeave = () => {
        setIsPanning(false);
    };

    const isPositive = priceChange >= 0;

    // Get max volume for scaling
    const maxVolume = Math.max(...chartData.map(d => d.volume));

    // Slice data based on window for panning
    const visibleData = chartData.slice(dataWindow.start, dataWindow.end);

    return (
        <div className="relative w-full h-full bg-gradient-to-b from-[#0a0a0a] to-[#050505] p-6">
            {/* Price Header */}
            <div className="mb-4">
                <div className="flex items-baseline gap-4">
                    <div className="text-4xl font-bold text-white">${currentPrice}</div>
                    <div className={`text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                    </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-400">{symbol.replace('USDT', '/USDT')}</div>
                        <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-0.5 bg-yellow-500"></div>
                                <span className="text-gray-400">MA7</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-0.5 bg-purple-500"></div>
                                <span className="text-gray-400">MA25</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeframe Selector */}
                    <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-lg p-1">
                        {TIMEFRAMES.map((tf) => (
                            <button
                                key={tf.value}
                                onClick={() => setInterval(tf.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${interval === tf.value
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                    : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                                    }`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Candlestick Chart */}
            <div
                ref={chartRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                tabIndex={-1}
                onFocus={(e) => e.target.blur()}
                style={{
                    cursor: isPanning ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    outline: 'none',
                    border: 'none'
                }}
            >
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={visibleData}>
                        <defs>
                            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#26a69a" stopOpacity={0.5} />
                                <stop offset="100%" stopColor="#26a69a" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1a1a1a"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="time"
                            stroke="#333"
                            tick={{ fill: '#666', fontSize: 10 }}
                            tickLine={false}
                            interval="preserveStartEnd"
                            axisLine={{ stroke: '#222' }}
                        />
                        <YAxis
                            yAxisId="price"
                            domain={['dataMin - 100', 'dataMax + 100']}
                            stroke="#333"
                            tick={{ fill: '#666', fontSize: 10 }}
                            tickLine={false}
                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                            orientation="right"
                            axisLine={{ stroke: '#222' }}
                        />
                        <YAxis
                            yAxisId="volume"
                            orientation="left"
                            tick={false}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, maxVolume * 4]}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                // Don't show tooltip when panning
                                if (isPanning) return null;
                                if (!active || !payload || !payload[0]) return null;
                                const data = payload[0].payload;
                                const isGreen = data.close >= data.open;

                                return (
                                    <div style={{
                                        backgroundColor: 'rgba(10, 10, 10, 0.98)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '10px',
                                        padding: '14px',
                                        color: '#fff',
                                        fontSize: '11px',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                                    }}>
                                        <div style={{ marginBottom: '6px', fontWeight: 'bold', color: '#999' }}>
                                            {data.time}
                                        </div>
                                        <div style={{ color: isGreen ? '#26a69a' : '#ef5350', marginBottom: '2px' }}>
                                            O: ${data.open.toFixed(2)}
                                        </div>
                                        <div style={{ color: '#26a69a', marginBottom: '2px' }}>
                                            H: ${data.high.toFixed(2)}
                                        </div>
                                        <div style={{ color: '#ef5350', marginBottom: '2px' }}>
                                            L: ${data.low.toFixed(2)}
                                        </div>
                                        <div style={{ color: isGreen ? '#26a69a' : '#ef5350', fontWeight: 'bold', marginBottom: '4px' }}>
                                            C: ${data.close.toFixed(2)}
                                        </div>
                                        <div style={{ color: '#666', fontSize: '10px', borderTop: '1px solid #222', paddingTop: '4px' }}>
                                            Vol: {(data.volume / 1000).toFixed(2)}K
                                        </div>
                                    </div>
                                );
                            }}
                        />
                        {/* Grid lines */}
                        <ReferenceLine yAxisId="price" y={0} stroke="#1a1a1a" strokeDasharray="3 3" />

                        {/* Volume bars */}
                        <Bar
                            yAxisId="volume"
                            dataKey="volume"
                            fill="url(#volumeGradient)"
                            opacity={0.3}
                            isAnimationActive={false}
                        />

                        {/* MA Lines */}
                        <Line
                            yAxisId="price"
                            type="monotone"
                            dataKey="ma7"
                            stroke="#26a69a"
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                        />
                        <Line
                            yAxisId="price"
                            type="monotone"
                            dataKey="ma25"
                            stroke="#ef5350"
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                        />

                        {/* Candlesticks */}
                        <Bar
                            yAxisId="price"
                            dataKey="high"
                            shape={<CandleStick />}
                            isAnimationActive={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Watermark */}
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-6xl font-bold text-white/5 pointer-events-none select-none">
                {symbol.replace('USDT', '')}
            </div>
        </div>
    );
}
