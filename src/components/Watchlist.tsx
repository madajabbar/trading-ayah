"use client";
import Link from "next/link";
import { Quote } from "@/lib/market";
import { fmtNum, fmtPct, fmtPrice } from "@/lib/format";

export default function Watchlist({ quotes }: { quotes: Quote[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {quotes.map((q) => {
        const up = q.changePct >= 0;
        return (
          <Link key={q.symbol} href={`/chart/${q.symbol}`} className="card p-4 block hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[15px] font-semibold">{q.symbol}</div>
                <div className="text-[12px] text-neutral-400">{q.name}</div>
              </div>
              <span className={`badge ${q.label === "LIVE" ? "badge-live" : "badge-delayed"}`}>
                {q.label}
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tabular-nums">
              {q.price ? fmtPrice(q.price) : "…"}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`badge ${up ? "badge-up" : "badge-down"}`}>
                {q.changePct !== 0 ? fmtPct(q.changePct) : "0,00%"}
              </span>
              <span className="text-[12px] text-neutral-400">
                {q.source === "biquote" ? "biquote" : q.source === "gold-api" ? "gold-api" : "Yahoo"}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
