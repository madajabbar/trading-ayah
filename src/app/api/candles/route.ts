import { NextRequest, NextResponse } from "next/server";
import { TF, TF_LIST, TF_YAHOO } from "@/lib/config";
import { fetchYahooCandles } from "@/lib/market";

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "XAUUSD").toUpperCase();
  const tfRaw = (req.nextUrl.searchParams.get("tf") || "H1").toUpperCase();
  const tf = (TF_LIST.includes(tfRaw as TF) ? tfRaw : "H1") as TF;
  try {
    const candles = await fetchYahooCandles(symbol, tf);
    return NextResponse.json({
      symbol,
      tf,
      interval: TF_YAHOO[tf],
      label: "DELAYED",
      source: "yahoo",
      count: candles.length,
      candles,
      ts: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
