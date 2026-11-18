"use client";
import { useEffect, useRef, useState } from "react";
import { createChart, HistogramSeries, LineSeries, ColorType } from "lightweight-charts";

interface Pt {
  time: number;
  val1: number;
  line1: number;
  line2: number;
  up: boolean;
  up2: boolean;
  state: "bull" | "bear" | "mixed";
}
interface QqeRes {
  symbol: string;
  tf: string;
  series: Pt[];
  hvi: { value: number | null; regime: string };
}

const COLOR: Record<string, string> = { bull: "#0d9488", bear: "#dc2626", mixed: "#9ca3af" };

export default function QqeSubChart({ symbol, tf }: { symbol: string; tf: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hvi, setHvi] = useState<QqeRes["hvi"] | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      height: 120,
      layout: { background: { type: ColorType.Solid, color: "#fff" }, textColor: "#9aa0a6" },
      grid: { vertLines: { color: "#f8f9fa" }, horzLines: { color: "#f8f9fa" } },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    const hist = chart.addSeries(HistogramSeries, { priceFormat: { type: "price", precision: 2, minMove: 0.01 } });
    const l1 = chart.addSeries(LineSeries, { color: "#0b57d0", lineWidth: 1 });
    const l2 = chart.addSeries(LineSeries, { color: "#e37400", lineWidth: 1 });
    let on = true;
    fetch(`/api/qqe?symbol=${symbol}&tf=${tf}`)
      .then((r) => r.json())
      .then((j: QqeRes) => {
        if (!on || (j as any).error) return;
        setHvi(j.hvi);
        hist.setData(j.series.map((p) => ({ time: p.time as any, value: p.val1, color: COLOR[p.state] })) as any);
        l1.setData(j.series.filter((p) => Number.isFinite(p.line1)).map((p) => ({ time: p.time as any, value: p.line1 })) as any);
        l2.setData(j.series.filter((p) => Number.isFinite(p.line2)).map((p) => ({ time: p.time as any, value: p.line2 })) as any);
        chart.timeScale().fitContent();
      })
      .catch(() => {});
    return () => { on = false; chart.remove(); };
  }, [symbol, tf]);

  return <div ref={ref} className="w-full" />;
}
