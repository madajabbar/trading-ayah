"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import { PAIRS, pairOf, CONTRACT, MIN_LOT } from "@/lib/config";
import { fmtNum } from "@/lib/format";

export default function KalkulatorPage() {
  const [symbol, setSymbol] = useState("XAUUSD");
  const [balance, setBalance] = useState(1000);
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState(3780);
  const [sl, setSl] = useState(3755);
  const [dir, setDir] = useState<"BUY" | "SELL">("BUY");

  const p = pairOf(symbol);
  const factor = CONTRACT(p);
  const riskMoney = balance * (riskPct / 100);
  const R = Math.abs(entry - sl);
  let lot = R > 0 ? riskMoney / (R * factor) : 0;
  lot = Math.max(MIN_LOT, Math.round(lot * 100) / 100);
  const tp1 = dir === "BUY" ? entry + 1.5 * R : entry - 1.5 * R;
  const tp2 = dir === "BUY" ? entry + 2.5 * R : entry - 2.5 * R;
  const tp3 = dir === "BUY" ? entry + 3.5 * R : entry - 3.5 * R;

  return (
    <div className="flex-1">
      <Nav />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="h1">Kalkulator Lot</h1>

        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-sm text-neutral-500">Pair</span>
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                {PAIRS.map((x) => <option key={x.symbol} value={x.symbol}>{x.symbol} — {x.name}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm text-neutral-500">Arah</span>
              <select value={dir} onChange={(e) => setDir(e.target.value as any)}>
                <option value="BUY">BUY (Long)</option>
                <option value="SELL">SELL (Short)</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="space-y-1">
              <span className="text-sm text-neutral-500">Saldo (Rp)</span>
              <input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-neutral-500">Risiko (%)</span>
              <input type="number" step="0.1" value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-neutral-500">Faktor kontrak</span>
              <input value={fmtNum(factor, 0)} disabled />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="space-y-1">
              <span className="text-sm text-neutral-500">Entry</span>
              <input type="number" step="0.01" value={entry} onChange={(e) => setEntry(Number(e.target.value))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-neutral-500">Stop Loss (SL)</span>
              <input type="number" step="0.01" value={sl} onChange={(e) => setSl(Number(e.target.value))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-neutral-500">Jarak SL (R)</span>
              <input value={fmtNum(R, 4)} disabled />
            </label>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <Row label="Risiko keuangan" value={`Rp ${fmtNum(riskMoney, 0)}`} />
          <Row label="Lot (min 0.01)" value={fmtNum(lot, 2)} strong />
          <Row label="Faktor kontrak" value={fmtNum(factor, 0)} />
          <Row label="TP1 (1.5R)" value={fmtNum(tp1, 4)} />
          <Row label="TP2 (2.5R)" value={fmtNum(tp2, 4)} />
          <Row label="TP3 (3.5R)" value={fmtNum(tp3, 4)} />
          <div className="text-[12px] text-neutral-400 pt-2 border-t border-neutral-100">
            Rumus: lot = (saldo × risiko%) ÷ (jarak SL × faktor). XAU faktor 100, Forex 100.000.
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span className={`tabular-nums font-semibold text-lg ${strong ? "text-black" : ""}`}>{value}</span>
    </div>
  );
}
