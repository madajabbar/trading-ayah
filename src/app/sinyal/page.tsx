"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { Signal } from "@/lib/signals";
import { fmtNum, fmtPrice, fmtTime } from "@/lib/format";

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const r = await fetch("/api/signals?limit=100");
      const j = await r.json();
      setSignals(j.signals || []);
      setErr("");
    } catch (e: any) { setErr(e.message || "gagal"); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex-1">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="h1">Riwayat Sinyal</h1>
          <button onClick={load} className="btn">Perbarui</button>
        </div>

        {err && <div className="card p-4 text-sm text-[#c5221f]">{err}</div>}

        {signals.length === 0 ? (
          <div className="card p-8 text-center text-neutral-400">
            Belum ada sinyal. Webhook masuk akan muncul di sini.
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((s) => {
              const up = s.signal === "BUY";
              return (
                <div key={s.id} className="card p-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{s.symbol}</span>
                      <span className="badge bg-neutral-100 text-neutral-600">{s.timeframe}</span>
                      <span className={`badge ${up ? "badge-up" : "badge-down"}`}>{s.signal}</span>
                    </div>
                    <div className="text-[12px] text-neutral-400 mt-1">
                      {s.source === "webhook" ? "Webhook TradingView" : "Internal"} · {fmtTime(s.time)}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div><div className="text-neutral-400 text-[12px]">Harga</div><div className="font-semibold">{fmtPrice(s.price)}</div></div>
                    <div><div className="text-neutral-400 text-[12px]">Skor</div><div className="font-semibold">{fmtNum(s.score)}</div></div>
                    <div><div className="text-neutral-400 text-[12px]">SL</div><div className="font-medium">{fmtPrice(s.sl)}</div></div>
                    <div><div className="text-neutral-400 text-[12px]">TP1/2/3</div><div className="font-medium">{fmtPrice(s.tp1)} / {fmtPrice(s.tp2)} / {fmtPrice(s.tp3)}</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
