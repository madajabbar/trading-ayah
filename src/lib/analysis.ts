import { CONTRACT, MIN_LOT, PAIRS, pairOf, TF } from "./config";
import { atr, computePivot, dailyVwap, ema, macd, rsi } from "./indicators";
import { Candle, fetchYahooCandles } from "./market";

export interface AnalysisInput {
  balance: number;
  riskPct: number;
}

/** waktu WIB (UTC+7) */
export const wibNow = () => {
  const d = new Date(Date.now() + 7 * 3600 * 1000);
  const hm = d.getUTCHours() * 60 + d.getUTCMinutes();
  return hm;
};

export const sessionLabel = (hm: number): string => {
  if (hm >= 6 * 60 && hm < 14 * 60) return "Asia";
  if (hm >= 14 * 60 && hm < 22 * 60) return "London";
  return "New York";
};

export const killZone = (hm: number): string => {
  // Kill Zone London 14–17, NY 19.30–22.30
  if (hm >= 14 * 60 && hm < 17 * 60) return "London";
  if (hm >= 19 * 60 + 30 && hm < 22 * 60 + 30) return "New York";
  return null as unknown as string;
};

const last = <T>(a: T[]): T | undefined => a[a.length - 1];
const lastVal = (a: (number | null)[]): number | null => {
  for (let i = a.length - 1; i >= 0; i--) if (a[i] != null) return a[i]!;
  return null;
};
const direction = (e20: number | null, e50: number | null): "up" | "down" | null =>
  e20 == null || e50 == null ? null : e20 > e50 ? "up" : "down";

export interface AnalysisResult {
  symbol: string;
  tf: TF;
  price: number;
  atr: number;
  rsi: number;
  macdHist: number;
  vwap: number;
  pivot: ReturnType<typeof computePivot>;
  ema: { e20: number; e50: number; e200: number };
  bias: { d1: "up" | "down" | null; htf: "up" | "down" | null; chart: "up" | "down" | null };
  scoreBuy: number;
  scoreSell: number;
  direction: "BUY" | "SELL" | "NEUTRAL";
  strong: boolean;
  session: string;
  kill: string | null;
  trade?: {
    entry: number;
    sl: number;
    tp1: number;
    tp2: number;
    tp3: number;
    risk: number;
    lot: number;
    factor: number;
  };
}

function trendFor(closes: number[]): "up" | "down" | null {
  const e20 = lastVal(ema(closes, 20));
  const e50 = lastVal(ema(closes, 50));
  return direction(e20, e50);
}

export async function computeAnalysis(
  symbol: string,
  tf: TF,
  input: AnalysisInput
): Promise<AnalysisResult> {
  const p = pairOf(symbol);
  const [chartCandles, h4Candles, d1Candles] = await Promise.all([
    fetchYahooCandles(symbol, tf),
    fetchYahooCandles(symbol, "H4"),
    fetchYahooCandles(symbol, "D1"),
  ]);

  const closes = chartCandles.map((c) => c.close);
  const lastC = last(chartCandles)!;
  const price = lastC.close;

  // indikator chart
  const e20 = lastVal(ema(closes, 20));
  const e50 = lastVal(ema(closes, 50));
  const e200 = lastVal(ema(closes, 200));
  const rsiV = lastVal(rsi(closes, 14));
  const atrA = atr(chartCandles, 14);
  const atrV = lastVal(atrA);
  const macdOut = macd(closes);
  const macdHist = lastVal(macdOut.hist);
  const vwapArr = dailyVwap(chartCandles);
  const vwapV = lastVal(vwapArr);
  const pivot = computePivot(d1Candles);

  // bias
  const biasD1 = trendFor(d1Candles.map((c) => c.close));
  const biasHtf = trendFor(h4Candles.map((c) => c.close));
  const biasChart = trendFor(closes);

  const chartUp = biasChart === "up";
  const chartDown = biasChart === "down";

  // scoring
  let scoreBuy = 0, scoreSell = 0;
  const check = (cond: boolean, pts: number, side: "buy" | "sell") => {
    if (cond) { if (side === "buy") scoreBuy += pts; else scoreSell += pts; }
  };

  // 1. HTF H4 searah +25
  if (biasHtf === "up" && chartUp) check(true, 25, "buy");
  if (biasHtf === "down" && chartDown) check(true, 25, "sell");
  // 2. bias D1 +10
  check(biasD1 === "up", 10, "buy");
  check(biasD1 === "down", 10, "sell");
  // 3. trend chart EMA sejajar +20
  check(chartUp && e50 != null && e200 != null && e50! > e200!, 20, "buy");
  check(chartDown && e50 != null && e200 != null && e50! < e200!, 20, "sell");
  // 4. RSI +15
  check(rsiV != null && rsiV! >= 50 && rsiV! <= 70, 15, "buy");
  check(rsiV != null && rsiV! >= 30 && rsiV! <= 50, 15, "sell");
  // 5. MACD +15
  check(macdHist != null && macdHist! > 0, 15, "buy");
  check(macdHist != null && macdHist! < 0, 15, "sell");
  // 6. lokasi +15 (pullback EMA20) / break high-low +10
  if (chartUp && e20 != null) {
    const pullback = Math.abs(price - e20!) / price < 0.003; // dekat EMA20
    check(pullback, 15, "buy");
  }
  if (chartDown && e20 != null) {
    const pullback = Math.abs(price - e20!) / price < 0.003;
    check(pullback, 15, "sell");
  }
  // break recent high/low
  const recent = chartCandles.slice(-10);
  const recentHigh = Math.max(...recent.map((c) => c.high));
  const recentLow = Math.min(...recent.map((c) => c.low));
  check(chartUp && price >= recentHigh, 10, "buy");
  check(chartDown && price <= recentLow, 10, "sell");
  // 7. candle konfirmasi + Kill Zone +10
  const hm = wibNow();
  const kill = killZone(hm);
  const bullCandle = lastC.close > lastC.open;
  const bearCandle = lastC.close < lastC.open;
  const inKill = kill !== null;
  check(bullCandle, inKill ? 10 : 5, "buy");
  check(bearCandle, inKill ? 10 : 5, "sell");

  // keputusan
  let directionV: AnalysisResult["direction"] = "NEUTRAL";
  let strong = false;
  if (scoreBuy >= 70 && scoreBuy - scoreSell > 15) { directionV = "BUY"; strong = true; }
  else if (scoreSell >= 70 && scoreSell - scoreBuy > 15) { directionV = "SELL"; strong = true; }
  else if (scoreBuy > scoreSell) directionV = "BUY";
  else if (scoreSell > scoreBuy) directionV = "SELL";

  const result: AnalysisResult = {
    symbol,
    tf,
    price,
    atr: atrV ?? 0,
    rsi: rsiV ?? 0,
    macdHist: macdHist ?? 0,
    vwap: vwapV ?? 0,
    pivot,
    ema: { e20: e20 ?? 0, e50: e50 ?? 0, e200: e200 ?? 0 },
    bias: { d1: biasD1, htf: biasHtf, chart: biasChart },
    scoreBuy, scoreSell,
    direction: directionV,
    strong,
    session: sessionLabel(hm),
    kill,
  };

  if (strong && atrV && atrV > 0) {
    const factor = CONTRACT(p);
    const slDist = 1.5 * atrV;
    const entry = price;
    const sl = directionV === "BUY" ? entry - slDist : entry + slDist;
    const R = Math.abs(entry - sl);
    const tp1 = directionV === "BUY" ? entry + 1.5 * R : entry - 1.5 * R;
    const tp2 = directionV === "BUY" ? entry + 2.5 * R : entry - 2.5 * R;
    const tp3 = directionV === "BUY" ? entry + 3.5 * R : entry - 3.5 * R;
    const riskMoney = input.balance * (input.riskPct / 100);
    let lot = riskMoney / (R * factor);
    lot = Math.max(MIN_LOT, Math.round(lot * 100) / 100);
    result.trade = {
      entry, sl, tp1, tp2, tp3,
      risk: Math.round(riskMoney * 100) / 100,
      lot, factor,
    };
  }

  return result;
}
