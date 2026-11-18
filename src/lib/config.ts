export type PairType = "gold" | "forex" | "index";

export interface Pair {
  symbol: string;
  name: string;
  yahoo: string;
  type: PairType;
}

export const PAIRS: Pair[] = [
  { symbol: "XAUUSD", name: "Emas", yahoo: "GC=F", type: "gold" },
  { symbol: "EURUSD", name: "EUR/USD", yahoo: "EURUSD=X", type: "forex" },
  { symbol: "GBPUSD", name: "GBP/USD", yahoo: "GBPUSD=X", type: "forex" },
  { symbol: "USDJPY", name: "USD/JPY", yahoo: "USDJPY=X", type: "forex" },
  { symbol: "AUDUSD", name: "AUD/USD", yahoo: "AUDUSD=X", type: "forex" },
  { symbol: "DXY", name: "Dolar Index", yahoo: "DX-Y.NYB", type: "index" },
];

export const pairOf = (s: string): Pair =>
  PAIRS.find((p) => p.symbol === s) ?? PAIRS[0];

/** faktor kontrak per lot */
export const CONTRACT = (p: Pair): number =>
  p.type === "gold" ? 100 : p.type === "forex" ? 100000 : 100;
export const MIN_LOT = 0.01;

export type TF = "M5" | "M15" | "H1" | "H4" | "D1";

export const TF_LIST: TF[] = ["M5", "M15", "H1", "H4", "D1"];

/** interval Yahoo untuk tiap TF chart utama */
export const TF_YAHOO: Record<TF, string> = {
  M5: "5m",
  M15: "15m",
  H1: "60m",
  H4: "1h",
  D1: "1d",
};

export const TF_LABEL: Record<TF, string> = {
  M5: "M5",
  M15: "M15",
  H1: "H1",
  H4: "H4",
  D1: "D1",
};

export type Mode = "Scalping" | "Intraday" | "Swing";
export const MODES: Mode[] = ["Scalping", "Intraday", "Swing"];
export const DEFAULT_MODE: Mode = "Intraday";

export const CACHE_TTL_MS = 25_000;
