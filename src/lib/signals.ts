export interface Signal {
  id: string;
  symbol: string;
  timeframe: string;
  signal: string;
  score: number;
  price: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  time: string;
  source: "webhook" | "internal";
}

const MAX = 100;
let seq = 0;
const mem: Signal[] = [];

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisGet(): Promise<Signal[]> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return [...mem];
  const r = await fetch(`${UPSTASH_URL}/lrange/signals/0/-1`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  if (!r.ok) return [...mem];
  const j = await r.json();
  return ((j?.result ?? []) as string[]).map((s) => JSON.parse(s));
}

async function redisPush(raw: Signal) {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    await fetch(`${UPSTASH_URL}/lpush/signals/${encodeURIComponent(JSON.stringify(raw))}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
  }
}

export async function pushSignal(data: Omit<Signal, "id" | "source">): Promise<Signal> {
  const sig: Signal = { ...data, id: `sig-${Date.now()}-${seq++}`, source: "webhook" };
  mem.unshift(sig);
  if (mem.length > MAX) mem.length = MAX;
  await redisPush(sig);
  return sig;
}

export async function listSignals(limit = 100): Promise<Signal[]> {
  const all = UPSTASH_URL && UPSTASH_TOKEN ? await redisGet() : mem;
  return all.slice(0, Math.min(limit, MAX));
}
