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
/** RMA / Wilder smoothing (alpha 1/period), seeding SMA of first `period` values */
const rmaClean = (arr: number[], period: number): number[] => {
  const n = arr.length;
  const out = new Array(n).fill(NaN);
  if (n < period) return out;
  let s = 0;
  while (s < n && !Number.isFinite(arr[s])) s++; // skip NaN prefix
  if (n - s < period) return out;
  let prev = 0;
  for (let i = s; i < s + period; i++) prev += arr[i];
  prev /= period;
  out[s + period - 1] = prev;
  for (let i = s + period; i < n; i++) {
    prev = (prev * (period - 1) + arr[i]) / period;
    out[i] = prev;
  }
  return out;
};

export interface QqeOut {
  val: (number | null)[]; // rsiMa - 50
  line: (number | null)[]; // trailing - 50
  up: boolean[];
}

/**
 * QQE Mod (Mihkel00). Dihitung pd array close.
 * val = rsiMa - 50, line = trailing line - 50, up = arah trailing.
 */
export const qqe = (closes: number[], len = 6, sf = 5, factor = 3.0): QqeOut => {
  const n = closes.length;
  const out: QqeOut = {
    val: new Array(n).fill(null),
    line: new Array(n).fill(null),
    up: new Array(n).fill(false),
  };
  if (n < len + 2) return out;
  const rsiV = rsi(closes, len);
  const first = rsiV.findIndex((v) => v != null);
  if (first < 0) return out;
  const clean: number[] = [];
  const idx: number[] = [];
  for (let i = first; i < n; i++) {
    if (rsiV[i] != null) { clean.push(rsiV[i]!); idx.push(i); }
  }
  const eFull = ema(clean, sf);
  const k0 = eFull.findIndex((v) => v != null);
  if (k0 < 0) return out;
  const M = clean.length - k0;
  const ev: number[] = new Array(M).fill(NaN);
  for (let i = 0; i < M; i++) ev[i] = eFull[k0 + i]!;
  const wp = len * 2 - 1;
  const chg: number[] = new Array(Math.max(0, M - 1)).fill(NaN);
  for (let i = 1; i < M; i++) chg[i - 1] = Math.abs(ev[i] - ev[i - 1]);
  const atrRsi = rmaClean(chg, wp);
  const maAtr = rmaClean(atrRsi, wp);
  let tl = ev[0];
  let isUp = true;
  let prevMa = ev[0];
  out.val[idx[k0]] = ev[0] - 50;
  out.line[idx[k0]] = tl - 50;
  out.up[idx[k0]] = true;
  for (let p = 1; p < M; p++) {
    const ma = ev[p];
    const delta = maAtr[p - 1] * factor;
    if (Number.isFinite(delta)) {
      const upper = ma + delta;
      const lower = ma - delta;
      const crossUp = prevMa <= tl && ma > tl;
      const crossDown = prevMa >= tl && ma < tl;
      if (crossUp) { isUp = true; tl = lower; }
      else if (crossDown) { isUp = false; tl = upper; }
      else tl = isUp ? Math.max(tl, lower) : Math.min(tl, upper);
    }
    prevMa = ma;
    const candleIdx = idx[k0 + p];
    out.val[candleIdx] = ma - 50;
    out.line[candleIdx] = tl - 50;
    out.up[candleIdx] = isUp;
  }
  return out;
};

/** Historical Volatility Indicator klasik: stdev(logRet,10)/stdev(logRet,100) */
export const hviValue = (closes: number[]): { value: number | null; regime: string } => {
  if (closes.length < 120) return { value: null, regime: "-" };
  const lr: number[] = [];
  for (let i = 1; i < closes.length; i++) lr.push(Math.log(closes[i] / closes[i - 1]));
  if (lr.length < 100) return { value: null, regime: "-" };
  const stdev = (a: number[]) => {
    const m = a.reduce((x, y) => x + y, 0) / a.length;
    return Math.sqrt(a.reduce((s, v) => s + (v - m) * (v - m), 0) / a.length);
  };
  const d100 = stdev(lr.slice(-100));
  if (!d100 || !isFinite(d100)) return { value: null, regime: "-" };
  const v = stdev(lr.slice(-10)) / d100;
  if (!isFinite(v)) return { value: null, regime: "-" };
  const regime = v < 0.5 ? "Kompresi" : v <= 1.0 ? "Normal" : "Ekspansi";
  return { value: v, regime };
};

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
