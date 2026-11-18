import { CACHE_TTL_MS, PAIRS, pairOf, TF, TF_YAHOO, TF_LABEL } from "./config";

export interface Candle {
  time: number; // unix detik
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  bid: number;
  ask: number;
  changePct: number;
  source: "biquote" | "gold-api" | "yahoo";
  label: "LIVE" | "DELAYED";
  timestamp: string;
  marketState: string;
}

const UA = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };

// ---------- cache sederhana ----------
const cache = new Map<string, { at: number; data: unknown }>();
function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const c = cache.get(key);
  if (c && Date.now() - c.at < ttl) return Promise.resolve(c.data as T);
  return fn().then((d) => {
    cache.set(key, { at: Date.now(), data: d });
    return d;
  });
}

const RANGE: Record<TF, string> = {
  M5: "3d",
  M15: "15d",
  H1: "60d",
  H4: "120d",
  D1: "600d",
};

export async function fetchYahooCandles(symbol: string, tf: TF): Promise<Candle[]> {
  const p = pairOf(symbol);
  const key = `yh:${symbol}:${tf}`;
  return cached(key, CACHE_TTL_MS, async () => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${p.yahoo}?interval=${TF_YAHOO[tf]}&range=${RANGE[tf]}`;
    const r = await fetch(url, { headers: UA });
    if (!r.ok) throw new Error(`Yahoo HTTP ${r.status} untuk ${symbol}`);
    const j = await r.json();
    const res = j?.chart?.result?.[0];
    if (!res) throw new Error(`Yahoo tanpa result untuk ${symbol}`);
    const ts: (number | null)[] = res.timestamp ?? [];
    const q = res.indicators?.quote?.[0] ?? {};
    const open: (number | null)[] = q.open ?? [];
    const high: (number | null)[] = q.high ?? [];
    const low: (number | null)[] = q.low ?? [];
    const close: (number | null)[] = q.close ?? [];
    const vol: (number | null)[] = q.volume ?? [];
    const out: Candle[] = [];
    for (let i = 0; i < ts.length; i++) {
      if (ts[i] == null || close[i] == null || open[i] == null) continue;
      out.push({
        time: ts[i]!,
        open: open[i]!,
        high: high[i] ?? close[i]!,
        low: low[i] ?? close[i]!,
        close: close[i]!,
        volume: vol[i] ?? 0,
      });
    }
    if (!out.length) throw new Error(`Yahoo kosong untuk ${symbol}`);
    return out;
  });
}

interface BiquoteQuote {
  bid?: number;
  ask?: number;
  mid?: number;
  dayDiffPercent?: number;
  timestamp?: string;
  marketState?: string;
  stale?: boolean;
}

async function fetchBiquote(symbol: string): Promise<BiquoteQuote | null> {
  try {
    const r = await fetch(`https://biquote.io/api/${encodeURIComponent(symbol)}`);
    if (!r.ok) return null;
    return (await r.json()) as BiquoteQuote;
  } catch {
    return null;
  }
}

async function fetchGoldApi(): Promise<{ price: number; ts: string } | null> {
  try {
    const r = await fetch("https://api.gold-api.com/price/XAU");
    if (!r.ok) return null;
    const j = await r.json();
    return { price: Number(j.price), ts: j.updatedAt ?? new Date().toISOString() };
  } catch {
    return null;
  }
}

export async function getQuotes(): Promise<Quote[]> {
  const out: Quote[] = [];
  for (const p of PAIRS) {
    const bq = await fetchBiquote(p.symbol);
    if (bq && bq.mid) {
      out.push({
        symbol: p.symbol,
        name: p.name,
        price: bq.mid,
        bid: bq.bid ?? bq.mid,
        ask: bq.ask ?? bq.mid,
        changePct: bq.dayDiffPercent ?? 0,
        source: "biquote",
        label: "LIVE",
        timestamp: bq.timestamp ?? new Date().toISOString(),
        marketState: bq.marketState ?? "open",
      });
      continue;
    }
    // fallback: gold-api utk XAU, Yahoo candle terakhir utk lain
    if (p.type === "gold") {
      const g = await fetchGoldApi();
      if (g) {
        out.push({
          symbol: p.symbol, name: p.name, price: g.price, bid: g.price, ask: g.price,
          changePct: 0, source: "gold-api", label: "DELAYED",
          timestamp: g.ts, marketState: "open",
        });
        continue;
      }
    }
    try {
      const candles = await fetchYahooCandles(p.symbol, "H1");
      const last = candles[candles.length - 1];
      const prev = candles[candles.length - 2];
      const chg = prev ? ((last.close - prev.close) / prev.close) * 100 : 0;
      out.push({
        symbol: p.symbol, name: p.name, price: last.close, bid: last.close, ask: last.close,
        changePct: chg, source: "yahoo", label: "DELAYED",
        timestamp: new Date(last.time * 1000).toISOString(), marketState: "open",
      });
    } catch {
      out.push({
        symbol: p.symbol, name: p.name, price: 0, bid: 0, ask: 0,
        changePct: 0, source: "yahoo", label: "DELAYED",
        timestamp: new Date().toISOString(), marketState: "closed",
      });
    }
  }
  return out;
}

export async function getQuote(symbol: string): Promise<Quote | null> {
  const q = await getQuotes();
  return q.find((x) => x.symbol === symbol) ?? null;
}
