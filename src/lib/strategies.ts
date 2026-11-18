import { AnalysisResult } from "@/lib/analysis";
import { Candle } from "@/lib/market";
import { ema } from "@/lib/indicators";

export type StrategyId = "skor" | "pullback" | "breakout" | "pantulan";

export const STRATEGIES: { id: StrategyId; label: string }[] = [
  { id: "skor", label: "Skor Pro" },
  { id: "pullback", label: "Pullback Tren" },
  { id: "breakout", label: "Breakout-Retest" },
  { id: "pantulan", label: "Pantulan Level" },
];

export interface ChecklistItem {
  label: string;
  pass: boolean;
  detail: string;
}

export interface StrategyPriceLine {
  price: number;
  color: string;
  title: string;
  dashed?: boolean;
  width?: number;
}

export interface StrategyMarker {
  time: number;
  pos: "aboveBar" | "belowBar" | "inBar";
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  color: string;
  text?: string;
}

export interface StrategyChart {
  emas: ("e20" | "e50" | "e200")[];
  priceLines: StrategyPriceLine[];
  markers: StrategyMarker[];
}

export interface StrategyResult {
  id: StrategyId;
  title: string;
  direction: "BUY" | "SELL" | null;
  active: boolean;
  items: ChecklistItem[];
  entry?: number;
  sl?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  chart: StrategyChart;
}

const last = <T,>(a: T[]): T | undefined => a[a.length - 1];

function plan(dir: "BUY" | "SELL", price: number, atr: number) {
  const slDist = 1.5 * atr;
  const sl = dir === "BUY" ? price - slDist : price + slDist;
  const R = Math.abs(price - sl);
  return {
    entry: price,
    sl,
    tp1: dir === "BUY" ? price + 1.5 * R : price - 1.5 * R,
    tp2: dir === "BUY" ? price + 2.5 * R : price - 2.5 * R,
    tp3: dir === "BUY" ? price + 3.5 * R : price - 3.5 * R,
  };
}

interface Ctx {
  a: AnalysisResult;
  candles: Candle[];
}

export function computeStrategy(id: StrategyId, ctx: Ctx): StrategyResult {
  const a = ctx.a;
  const atr = a.atr > 0 ? a.atr : 1;
  switch (id) {
    case "pullback": return pullback(ctx, atr);
    case "breakout": return breakout(ctx, atr);
    case "pantulan": return pantulan(ctx, atr);
    case "skor":
    default:
      return {
        id: "skor",
        title: "Skor Pro",
        direction: a.strong ? (a.direction === "BUY" ? "BUY" : a.direction === "SELL" ? "SELL" : null) : null,
        active: a.strong,
        items: [],
        chart: { emas: ["e20", "e50", "e200"], priceLines: [], markers: [] },
      };
  }
}

function pullback(ctx: Ctx, atr: number): StrategyResult {
  const { a, candles } = ctx;
  const closes = candles.map((c) => c.close);
  const e20a = ema(closes, 20);
  const e20 = e20a[e20a.length - 1];
  const dir = a.bias.chart;
  const up = dir === "up";
  const n = candles.length;
  const price = a.price;

  const htf = a.bias.htf === dir;

  let touch = false;
  const touchIdx: number[] = [];
  for (let i = Math.max(2, n - 5); i < n; i++) {
    const c = candles[i];
    if (e20a[i] != null && c.low <= e20a[i]! && c.high >= e20a[i]!) {
      touch = true;
      touchIdx.push(i);
    }
  }
  if (!touch && e20 != null) {
    touch = Math.abs(price - e20) / price < 0.003;
    if (touch) touchIdx.push(n - 1);
  }

  const lastC = last(candles)!;
  const conf = up ? lastC.close > lastC.open : lastC.close < lastC.open;
  const rsiHealthy = up ? a.rsi >= 40 && a.rsi <= 70 : a.rsi >= 30 && a.rsi <= 60;

  const active = !!dir && htf && touch && conf && rsiHealthy;
  const tradeDir: "BUY" | "SELL" | null = dir === "up" ? "BUY" : dir === "down" ? "SELL" : null;
  const tp = active && tradeDir ? plan(tradeDir, price, atr) : null;

  const markers: StrategyMarker[] = touchIdx.map((i) => ({
    time: candles[i].time,
    pos: "belowBar",
    shape: "circle",
    color: up ? "#0b57d0" : "#e37400",
    text: "EMA20",
  }));
  const p20 = e20 != null ? [{ price: e20, color: "#0b57d0", title: "EMA20", width: 2 }] : [];

  return {
    id: "pullback",
    title: "Pullback Tren",
    direction: tradeDir,
    active,
    items: [
      { label: "Trend HTF searah", pass: htf, detail: a.bias.htf === "up" ? "HTF naik" : a.bias.htf === "down" ? "HTF turun" : "HTF datar" },
      { label: "Harga sentuh EMA20", pass: touch, detail: e20 != null ? `EMA20 ${e20.toFixed(2)}` : "EMA20 tidak ada" },
      { label: "Candle konfirmasi", pass: conf, detail: up ? "bullish tutup di atas open" : "bearish tutup di bawah open" },
      { label: "RSI sehat", pass: rsiHealthy, detail: `RSI ${a.rsi.toFixed(1)}` },
    ],
    entry: tp?.entry,
    sl: tp?.sl,
    tp1: tp?.tp1,
    tp2: tp?.tp2,
    tp3: tp?.tp3,
    chart: { emas: ["e20"], priceLines: p20, markers },
  };
}

function breakout(ctx: Ctx, atr: number): StrategyResult {
  const { a, candles } = ctx;
  const pdh = a.pivot.pdh, pdl = a.pivot.pdl;
  const n = candles.length;
  const win = candles.slice(Math.max(0, n - 50));
  const wStart = n - win.length;

  let upIdx = -1, dnIdx = -1, upC: Candle | null = null, dnC: Candle | null = null;
  for (let i = 0; i < win.length; i++) {
    const c = win[i];
    if (upIdx < 0 && c.close > pdh && pdh > 0) { upIdx = wStart + i; upC = c; }
    if (dnIdx < 0 && c.close < pdl && pdl > 0) { dnIdx = wStart + i; dnC = c; }
    if (upIdx >= 0 && dnIdx >= 0) break;
  }
  let dir: "up" | "down" | null = null;
  let breakIdx = -1, breakC: Candle | null = null;
  if (upIdx >= 0 && dnIdx >= 0) {
    if (upIdx >= dnIdx) { dir = "up"; breakIdx = upIdx; breakC = upC; }
    else { dir = "down"; breakIdx = dnIdx; breakC = dnC; }
  } else if (upIdx >= 0) { dir = "up"; breakIdx = upIdx; breakC = upC; }
  else if (dnIdx >= 0) { dir = "down"; breakIdx = dnIdx; breakC = dnC; }

  const breakValid = dir !== null;
  const level = dir === "up" ? pdh : pdl;

  let retest = false;
  if (breakValid && breakC) {
    for (let i = breakIdx + 1; i < n; i++) {
      const c = candles[i];
      if (dir === "up") {
        if (c.low <= level + 0.25 * atr && c.close >= level - 0.25 * atr) { retest = true; break; }
      } else {
        if (c.high >= level - 0.25 * atr && c.close <= level + 0.25 * atr) { retest = true; break; }
      }
    }
  }

  let volSup = false;
  if (breakValid && breakC) {
    const pre = candles.slice(Math.max(0, breakIdx - 20), breakIdx);
    const avgV = pre.length ? pre.reduce((s, c) => s + c.volume, 0) / pre.length : 0;
    const rng = breakC.high - breakC.low;
    volSup = (avgV > 0 && breakC.volume > 1.2 * avgV) || rng > 1.2 * atr;
  }

  const active = breakValid && retest && volSup;
  const tradeDir: "BUY" | "SELL" | null = dir === "up" ? "BUY" : dir === "down" ? "SELL" : null;
  const tp = active && tradeDir ? plan(tradeDir, a.price, atr) : null;

  const markers: StrategyMarker[] = breakC ? [{
    time: breakC.time,
    pos: dir === "up" ? "belowBar" : "aboveBar",
    shape: dir === "up" ? "arrowUp" : "arrowDown",
    color: dir === "up" ? "#137333" : "#c5221f",
    text: "Break",
  }] : [];

  const priceLines: StrategyPriceLine[] = [
    ...(pdh > 0 ? [{ price: pdh, color: "#0b57d0", title: "PDH", width: 2 }] : []),
    ...(pdl > 0 ? [{ price: pdl, color: "#e37400", title: "PDL", width: 2 }] : []),
    ...(a.pivot.pwh > 0 ? [{ price: a.pivot.pwh, color: "#9aa0a6", title: "PWH", dashed: true }] : []),
    ...(a.pivot.pwl > 0 ? [{ price: a.pivot.pwl, color: "#9aa0a6", title: "PWL", dashed: true }] : []),
  ];

  return {
    id: "breakout",
    title: "Breakout-Retest",
    direction: tradeDir,
    active,
    items: [
      { label: "Break valid", pass: breakValid, detail: breakValid ? (dir === "up" ? `close > PDH ${pdh.toFixed(2)}` : `close < PDL ${pdl.toFixed(2)}`) : "belum ada break dalam 50 candle" },
      { label: "Retest terjadi", pass: retest, detail: retest ? "harga kembali ke level lalu memantul" : "belum retest (tunggu harga kembali)" },
      { label: "Volume/ATR dukung", pass: volSup, detail: volSup ? "volume/range meyakinkan" : "volume/range lemah" },
    ],
    entry: tp?.entry,
    sl: tp?.sl,
    tp1: tp?.tp1,
    tp2: tp?.tp2,
    tp3: tp?.tp3,
    chart: { emas: ["e20", "e50", "e200"], priceLines, markers },
  };
}

function pantulan(ctx: Ctx, atr: number): StrategyResult {
  const { a, candles } = ctx;
  const p = a.pivot;
  const pivot = p.pivot;
  const r1 = p.pdh > 0 ? 2 * pivot - p.pdl : 0;
  const s1 = p.pdl > 0 ? 2 * pivot - p.pdh : 0;
  const levels: { v: number; label: string }[] = [
    { v: pivot, label: "Pivot" },
    { v: p.pdh, label: "PDH" },
    { v: p.pdl, label: "PDL" },
    { v: r1, label: "R1" },
    { v: s1, label: "S1" },
  ].filter((l) => l.v > 0);

  const price = a.price;
  let nearest: { v: number; label: string } | null = null;
  let nearestDist = Infinity;
  for (const l of levels) {
    const d = Math.abs(price - l.v);
    if (d < nearestDist) { nearestDist = d; nearest = l; }
  }
  const nearLevel = nearest != null && nearestDist < 0.5 * atr;

  const extremeLow = a.rsi < 30;
  const extremeHigh = a.rsi > 70;
  const expectUp = extremeLow;
  const expectDown = extremeHigh;

  const c = last(candles)!;
  const prev = candles[candles.length - 2];
  let rejection = false;
  if (prev) {
    const body = Math.abs(c.close - c.open);
    const wickUp = c.high - Math.max(c.open, c.close);
    const wickDn = Math.min(c.open, c.close) - c.low;
    const pin = Math.max(wickUp, wickDn) > 2 * body && body > 0;
    const bullEng = c.close > c.open && c.open < prev.close && c.close > prev.open;
    const bearEng = c.close < c.open && c.open > prev.close && c.close < prev.open;
    rejection = (expectUp && (pin && wickDn > wickUp)) || (expectUp && bullEng) ||
      (expectDown && (pin && wickUp > wickDn)) || (expectDown && bearEng) ||
      (!extremeLow && !extremeHigh);
  }

  const active = nearLevel && (extremeLow || extremeHigh) && rejection;
  const tradeDir: "BUY" | "SELL" | null = expectUp ? "BUY" : expectDown ? "SELL" : null;
  const tp = active && tradeDir ? plan(tradeDir, price, atr) : null;

  const markers: StrategyMarker[] = rejection ? [{
    time: c.time,
    pos: tradeDir === "BUY" ? "belowBar" : "aboveBar",
    shape: tradeDir === "BUY" ? "arrowUp" : "arrowDown",
    color: tradeDir === "BUY" ? "#137333" : "#c5221f",
    text: "Level",
  }] : [];

  const priceLines: StrategyPriceLine[] = levels.map((l) => ({
    price: l.v,
    color: l.label === "Pivot" ? "#7b1fa2" : l.label === "R1" || l.label === "S1" ? "#9aa0a6" : l.label === "PDH" ? "#0b57d0" : "#e37400",
    title: l.label,
    dashed: l.label === "Pivot",
  }));

  return {
    id: "pantulan",
    title: "Pantulan Level",
    direction: tradeDir,
    active,
    items: [
      { label: "Harga di level", pass: nearLevel, detail: nearest ? `terdekat ${nearest.label} (jarak ${nearestDist.toFixed(1)} vs 0.5ATR=${(0.5 * atr).toFixed(1)})` : "tidak dekat level" },
      { label: "RSI ekstrem", pass: extremeLow || extremeHigh, detail: extremeLow ? `RSI ${a.rsi.toFixed(1)} (<30)` : extremeHigh ? `RSI ${a.rsi.toFixed(1)} (>70)` : `RSI ${a.rsi.toFixed(1)}` },
      { label: "Candle penolakan", pass: rejection, detail: rejection ? "pin/engulfing" : "belum ada pin/engulfing" },
    ],
    entry: tp?.entry,
    sl: tp?.sl,
    tp1: tp?.tp1,
    tp2: tp?.tp2,
    tp3: tp?.tp3,
    chart: { emas: ["e20", "e50", "e200"], priceLines, markers },
  };
}
