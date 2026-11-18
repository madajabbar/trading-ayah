"use client";
import { AnalysisResult } from "@/lib/analysis";

interface OutSettings {
  telegram: string;
  discord: string;
}

const KEY = "trading-ayah-settings";
const SENT_KEY = "trading-ayah-sent";

export function readOut(): OutSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw).outgoing ?? { telegram: "", discord: "" };
  } catch {}
  return { telegram: "", discord: "" };
}

function sentKey(symbol: string, tf: string): string {
  return `${symbol}:${tf}`;
}

/** anti-spam: 1x per pair per TF (per sesi browser) */
export function alreadySent(symbol: string, tf: string): boolean {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(SENT_KEY) || "[]");
    return list.includes(sentKey(symbol, tf));
  } catch { return false; }
}

function markSent(symbol: string, tf: string) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(SENT_KEY) || "[]");
    if (!list.includes(sentKey(symbol, tf))) {
      list.push(sentKey(symbol, tf));
      localStorage.setItem(SENT_KEY, JSON.stringify(list));
    }
  } catch {}
}

/** kirim sinyal kuat ke Telegram/Discord bila terkonfigurasi */
export async function sendOutgoing(a: AnalysisResult): Promise<string> {
  const out = readOut();
  const targets: string[] = [];
  if (out.telegram) targets.push(out.telegram);
  if (out.discord) targets.push(out.discord);
  if (!targets.length) return "Tidak ada webhook keluar. Atur di Pengaturan.";

  const text = `📊 SINYAL ${a.symbol} (${a.tf})\nSinyal: ${a.direction} · Skor B${a.scoreBuy}/J${a.scoreSell}\nHarga: ${a.price}\n` +
    (a.trade ? `Entry ${a.trade.entry} · SL ${a.trade.sl} · TP1 ${a.trade.tp1} · TP2 ${a.trade.tp2} · TP3 ${a.trade.tp3}\nLot ${a.trade.lot} · Risiko Rp${a.trade.risk}` : "");
  const payload = { content: text };
  const errors: string[] = [];
  for (const url of targets) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) errors.push(`${url} → HTTP ${r.status}`);
    } catch (e: any) { errors.push(`${url} → ${e.message}`); }
  }
  markSent(a.symbol, a.tf);
  return errors.length ? "Kirim gagal: " + errors.join("; ") : "Terkirim.";
}
