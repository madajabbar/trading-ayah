import { NextRequest, NextResponse } from "next/server";
import { listSignals } from "@/lib/signals";

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 100);
  const signals = await listSignals(limit);
  return NextResponse.json({ count: signals.length, signals });
}
