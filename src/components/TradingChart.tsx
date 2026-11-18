"use client";
import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, LineSeries, ColorType, ISeriesApi, createSeriesMarkers, IPriceLine } from "lightweight-charts";
import { Candle } from "@/lib/market";
import { ema } from "@/lib/indicators";
import { StrategyChart, StrategyId } from "@/lib/strategies";

const EMA_KIND: Record<string, "e20" | "e50" | "e200"> = { e20: "e20", e50: "e50", e200: "e200" };

export default function TradingChart({ candles, strategy, overlay }: {
  candles: Candle[];
  strategy: StrategyId;
  overlay: StrategyChart;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const e20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const e50Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const e200Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const markersRef = useRef<any>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

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
    markersRef.current = createSeriesMarkers(candle);
    return () => { chart.remove(); chartRef.current = null; candleRef.current = null; e20Ref.current = null; e50Ref.current = null; e200Ref.current = null; markersRef.current = null; };
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

  // terapkan overlay strategi
  useEffect(() => {
    const candle = candleRef.current;
    if (!candle) return;

    e20Ref.current?.applyOptions({ visible: overlay.emas.includes("e20") });
    e50Ref.current?.applyOptions({ visible: overlay.emas.includes("e50") });
    e200Ref.current?.applyOptions({ visible: overlay.emas.includes("e200") });

    // price lines: hapus lama, buat baru
    for (const pl of priceLinesRef.current) candle.removePriceLine(pl);
    priceLinesRef.current = overlay.priceLines
      .filter((pl) => pl.price > 0 && isFinite(pl.price))
      .map((pl) => candle.createPriceLine({
        price: pl.price,
        color: pl.color,
        lineWidth: (pl.width || 1) as any,
        lineStyle: pl.dashed ? 2 : 0,
        title: pl.title,
        axisLabelVisible: true,
      }));

    // markers
    markersRef.current?.setMarkers(overlay.markers.map((m) => ({
      time: m.time as any,
      position: m.pos,
      shape: m.shape,
      color: m.color,
      text: m.text,
    })) as unknown[]);
  }, [overlay, candles]);

  return <div ref={ref} className="w-full" />;
}
