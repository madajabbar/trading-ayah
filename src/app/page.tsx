"use client";
import { useQuotes } from "@/components/useQuotes";
import Watchlist from "@/components/Watchlist";
import MiniAnalysis from "@/components/MiniAnalysis";
import SessionClock from "@/components/SessionClock";
import Nav from "@/components/Nav";
import { PAIRS } from "@/lib/config";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { quotes, loading } = useQuotes();
  const [banner, setBanner] = useState<{ symbol: string; dir: string; score: number } | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      for (const p of PAIRS) {
        const r = await fetch(`/api/analysis?symbol=${p.symbol}&tf=H1&balance=1000&risk=1`);
        const j = await r.json();
        if (on && j.strong) { setBanner({ symbol: p.symbol, dir: j.direction, score: Math.max(j.scoreBuy, j.scoreSell) }); break; }
      }
    })();
    return () => { on = false; };
  }, []);

  return (
    <div className="flex-1">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="h1">Dashboard</h1>
          <SessionClock />
        </div>

        {banner && (
          <div className="card p-5 border-l-4 border-l-blue-500 flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-500">Sinyal kuat terakhir</div>
              <div className="text-xl font-bold">
                {banner.symbol} — {banner.dir} (skor {banner.score})
              </div>
            </div>
            <a href={`/chart/${banner.symbol}`} className="btn btn-primary">Lihat chart</a>
          </div>
        )}

        <section>
          <h2 className="h2 mb-3">Watchlist</h2>
          {loading && quotes.length === 0 ? (
            <div className="text-neutral-400">Memuat harga…</div>
          ) : (
            <div className="space-y-3">
              <Watchlist quotes={quotes} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PAIRS.map((p) => <MiniAnalysis key={p.symbol} symbol={p.symbol} />)}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
