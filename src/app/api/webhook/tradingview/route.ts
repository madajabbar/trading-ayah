import { NextRequest, NextResponse } from "next/server";
import { pushSignal } from "@/lib/signals";

const SECRET = process.env.WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const secret = body.secret;
    if (SECRET && secret !== SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const signal = {
      symbol: String(body.symbol || "XAUUSD").toUpperCase(),
      timeframe: String(body.timeframe || "H1").toUpperCase(),
      signal: String(body.signal || "NEUTRAL").toUpperCase(),
      score: Number(body.score ?? 0),
      price: Number(body.price ?? 0),
      sl: Number(body.sl ?? 0),
      tp1: Number(body.tp1 ?? 0),
      tp2: Number(body.tp2 ?? 0),
      tp3: Number(body.tp3 ?? 0),
      time: body.time ? String(body.time) : new Date().toISOString(),
    };
    const saved = await pushSignal(signal);
    return NextResponse.json({ ok: true, id: saved.id, saved });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
}
