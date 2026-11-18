import { NextRequest, NextResponse } from "next/server";
import { TF, TF_LIST } from "@/lib/config";
import { fetchYahooCandles } from "@/lib/market";
import { hviValue, qqe } from "@/lib/indicators";

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "XAUUSD").toUpperCase();
  const tfRaw = (req.nextUrl.searchParams.get("tf") || "H1").toUpperCase();
  const tf = (TF_LIST.includes(tfRaw as TF) ? tfRaw : "H1") as TF;
  try {
    const candles = await fetchYahooCandles(symbol, tf);
    const closes = candles.map((c) => c.close);
    const q1 = qqe(closes, 6, 5, 3.0);
    const q2 = qqe(closes, 6, 5, 1.61);
    const fin = (v: number | null, d = 0) => (Number.isFinite(v as number) ? (v as number) : d);
    const series = candles.map((c, i) => ({
      time: c.time,
      val1: fin(q1.val[i]),
      line1: fin(q1.line[i]),
      line2: fin(q2.line[i]),
      up: !!q1.up[i],
      up2: !!q2.up[i],
      state: q1.up[i] && q2.up[i] ? "bull" : !q1.up[i] && !q2.up[i] ? "bear" : "mixed",
    }));
    return NextResponse.json({ symbol, tf, series, hvi: hviValue(closes) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
