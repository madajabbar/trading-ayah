import { Candle } from "./market";

export const ema = (arr: number[], period: number): (number | null)[] => {
  const out: (number | null)[] = new Array(arr.length).fill(null);
  if (arr.length < period) return out;
  let k = 2 / (period + 1);
  let prev = arr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = prev;
  for (let i = period; i < arr.length; i++) {
    prev = arr[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
};

/** RSI (Wilder) */
export const rsi = (closes: number[], period = 14): (number | null)[] => {
  const n = closes.length;
  const out: (number | null)[] = new Array(n).fill(null);
  if (n < period + 1) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgG = gain / period, avgL = loss / period;
  out[period] = 100 - 100 / (1 + (avgL === 0 ? 100 : avgG / avgL));
  for (let i = period + 1; i < n; i++) {
    const d = closes[i] - closes[i - 1];
    const g = d > 0 ? d : 0, l = d < 0 ? -d : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
    out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  }
  return out;
};

export interface MacdOut {
  macd: (number | null)[];
  signal: (number | null)[];
  hist: (number | null)[];
}
export const macd = (closes: number[], fast = 12, slow = 26, sig = 9): MacdOut => {
  const eFast = ema(closes, fast);
  const eSlow = ema(closes, slow);
  const macdLine: (number | null)[] = closes.map((_, i) =>
    eFast[i] != null && eSlow[i] != null ? eFast[i]! - eSlow[i]! : null
  );
  const vals = macdLine.filter((x): x is number => x != null);
  const sigRaw = ema(vals, sig);
  let idx = -1;
  const signal = macdLine.map((v) => (v != null ? sigRaw[++idx] : null));
  const hist = macdLine.map((v, i) => (v != null && signal[i] != null ? v - signal[i]! : null));
  return { macd: macdLine, signal, hist };
};

export const atr = (candles: Candle[], period = 14): (number | null)[] => {
  const n = candles.length;
  const out: (number | null)[] = new Array(n).fill(null);
  if (n < period) return out;
  let trSum = 0;
  for (let i = 1; i <= period; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trSum += tr;
  }
  let prev = trSum / period;
  out[period] = prev;
  for (let i = period + 1; i < n; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    prev = (prev * (period - 1) + tr) / period;
    out[i] = prev;
  }
  return out;
};

/** VWAP harian (dikelompokkan per tanggal UTC) */
export const dailyVwap = (candles: Candle[]): (number | null)[] => {
  const out: (number | null)[] = new Array(candles.length).fill(null);
  let dayStart = -1;
  let cumPV = 0, cumV = 0;
  const dayOf = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (dayStart === -1 || dayOf(c.time) !== dayOf(candles[dayStart].time)) {
      dayStart = i;
      cumPV = 0;
      cumV = 0;
    }
    const tp = (c.high + c.low + c.close) / 3;
    cumPV += tp * c.volume;
    cumV += c.volume;
    if (cumV > 0) out[i] = cumPV / cumV;
  }
  return out;
};

export interface Pivot {
  pivot: number;
  pdh: number;
  pdl: number;
  pwh: number;
  pwl: number;
  prevDay: { high: number; low: number; close: number } | null;
}

/** Pivot dari candle harian (D1) */
export const computePivot = (daily: Candle[]): Pivot => {
  const empty: Pivot = { pivot: 0, pdh: 0, pdl: 0, pwh: 0, pwl: 0, prevDay: null };
  if (daily.length < 2) return empty;
  const last = daily[daily.length - 1];
  const prev = daily[daily.length - 2];
  const pivot = (prev.high + prev.low + prev.close) / 3;
  // minggu terakhir: 5 hari trading terakhir sebelum hari terakhir
  const week = daily.slice(Math.max(0, daily.length - 6), daily.length - 1);
  const pwh = Math.max(...week.map((c) => c.high));
  const pwl = Math.min(...week.map((c) => c.low));
  return {
    pivot,
    pdh: prev.high,
    pdl: prev.low,
    pwh,
    pwl,
    prevDay: { high: prev.high, low: prev.low, close: prev.close },
    _last: last,
  } as Pivot & { _last: Candle };
};
