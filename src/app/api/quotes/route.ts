import { NextResponse } from "next/server";
import { getQuotes } from "@/lib/market";

export async function GET() {
  const quotes = await getQuotes();
  return NextResponse.json({ quotes, ts: new Date().toISOString() });
}
