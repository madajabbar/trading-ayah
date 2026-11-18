import { NextRequest, NextResponse } from "next/server";
import { TF, TF_LIST } from "@/lib/config";
import { computeAnalysis } from "@/lib/analysis";

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "XAUUSD").toUpperCase();
  const tfRaw = (req.nextUrl.searchParams.get("tf") || "H1").toUpperCase();
  const tf = (TF_LIST.includes(tfRaw as TF) ? tfRaw : "H1") as TF;
  const balance = Number(req.nextUrl.searchParams.get("balance") ?? 1000);
  const riskPct = Number(req.nextUrl.searchParams.get("risk") ?? 1);
  const momentumRaw = (req.nextUrl.searchParams.get("momentum") || "qqe").toLowerCase();
  const momentum = momentumRaw === "macd" || momentumRaw === "both" ? momentumRaw : "qqe";
  try {
    const result = await computeAnalysis(symbol, tf, { balance, riskPct, momentum });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
