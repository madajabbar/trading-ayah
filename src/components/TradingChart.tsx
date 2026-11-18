"use client";
import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, LineSeries, ColorType, ISeriesApi } from "lightweight-charts";
import { Candle } from "@/lib/market";
import { ema } from "@/lib/indicators";

export default function TradingChart({ candles }: { candles: Candle[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const e20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const e50Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const e200Ref = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      height: 420,
      layout: { background: { type: ColorType.Solid, color: "#fff" }, textColor: "#3c4043" },
      grid: { vertLines: { color: "#f1f3f4" }, horzLines: { color: "#f1f3f4" } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: "#137333", downColor: "#c5221f", borderUpColor: "#137333", borderDownColor: "#c5221f",
      wickUpColor: "#137333", wickDownColor: "#c5221f",
    });
    const e20 = chart.addSeries(LineSeries, { color: "#0b57d0", lineWidth: 2 });
    const e50 = chart.addSeries(LineSeries, { color: "#e37400", lineWidth: 2 });
    const e200 = chart.addSeries(LineSeries, { color: "#7b1fa2", lineWidth: 2 });
    chartRef.current = chart;
    candleRef.current = candle;
    e20Ref.current = e20;
    e50Ref.current = e50;
    e200Ref.current = e200;
    return () => { chart.remove(); chartRef.current = null; };
  }, []);

  useEffect(() => {
    if (!candles.length) return;
    const c = candles.map((x) => ({ time: x.time as any, open: x.open, high: x.high, low: x.low, close: x.close }));
    candleRef.current?.setData(c as any);

    const closes = candles.map((x) => x.close);
    const mk = (vals: (number | null)[]) =>
      vals.map((v, i) => ({ time: candles[i].time as any, value: v })).filter((p) => p.value != null) as any;
    e20Ref.current?.setData(mk(ema(closes, 20)));
    e50Ref.current?.setData(mk(ema(closes, 50)));
    e200Ref.current?.setData(mk(ema(closes, 200)));
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={ref} className="w-full" />;
}
