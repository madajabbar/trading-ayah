"use client";
import { StrategyResult } from "@/lib/strategies";
import { fmtNum, fmtPrice } from "@/lib/format";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0">
      <span className="text-neutral-500 text-[14px]">{label}</span>
      <span className={`tabular-nums text-[15px] ${strong ? "font-bold text-black" : "font-medium"}`}>{value}</span>
    </div>
  );
}

export default function StrategyPanel({ r, balance, riskPct }: { r: StrategyResult; balance: number; riskPct: number }) {
  const dir = r.direction;
  const dirClass = dir === "BUY" ? "text-[#137333]" : dir === "SELL" ? "text-[#c5221f]" : "text-neutral-500";
  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] text-neutral-400 uppercase tracking-wide">{r.title}</div>
          <div className={`text-3xl font-bold ${dirClass}`}>
            {dir === "BUY" ? "Beli" : dir === "SELL" ? "Jual" : "—"}
          </div>
        </div>
        <div className="text-right">
          <div className={`badge text-sm ${r.active ? "badge-live" : "badge-delayed"}`}>
            {r.active ? "STRATEGI AKTIF" : "Belum memenuhi syarat"}
          </div>
        </div>
      </div>

      <div>
        <div className="text-[13px] font-semibold text-neutral-500 mb-1">Checklist</div>
        <div className="space-y-1.5">
          {r.items.map((it) => (
            <div key={it.label} className="flex items-start gap-2 text-[14px]">
              <span className={`mt-0.5 ${it.pass ? "text-[#137333]" : "text-[#c5221f]"}`}>
                {it.pass ? "✓" : "✗"}
              </span>
              <div>
                <span className={`font-medium ${it.pass ? "text-black" : "text-neutral-700"}`}>{it.label}</span>
                <span className="text-neutral-400 ml-2 text-[13px]">{it.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {r.active && r.entry != null && r.sl != null && (
        <div>
          <div className="text-[13px] font-semibold text-neutral-500 mb-1">Rencana Trade (saldo {fmtNum(balance)} · risiko {riskPct}%)</div>
          <Row label="Entry" value={fmtPrice(r.entry)} strong />
          <Row label="Stop Loss (SL) — 1.5 ATR" value={fmtPrice(r.sl)} />
          {r.tp1 != null && <Row label="TP1 (1.5R)" value={fmtPrice(r.tp1)} />}
          {r.tp2 != null && <Row label="TP2 (2.5R)" value={fmtPrice(r.tp2)} />}
          {r.tp3 != null && <Row label="TP3 (3.5R)" value={fmtPrice(r.tp3)} />}
        </div>
      )}
    </div>
  );
}
