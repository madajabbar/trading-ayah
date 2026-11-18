"use client";
import { AnalysisResult } from "@/lib/analysis";
import { fmtNum, fmtPrice, fmtTime } from "@/lib/format";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0">
      <span className="text-neutral-500 text-[14px]">{label}</span>
      <span className={`tabular-nums text-[15px] ${strong ? "font-bold text-black" : "font-medium"}`}>{value}</span>
    </div>
  );
}

export default function AnalysisPanel({ a, balance, riskPct }: { a: AnalysisResult; balance: number; riskPct: number }) {
  const dir = a.direction;
  const dirClass = dir === "BUY" ? "text-[#137333]" : dir === "SELL" ? "text-[#c5221f]" : "text-neutral-500";
  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] text-neutral-400 uppercase tracking-wide">{a.symbol} · {a.tf}</div>
          <div className={`text-3xl font-bold ${dirClass}`}>{dir === "NEUTRAL" ? "Netral" : dir}</div>
        </div>
        <div className="text-right">
          <div className="text-[13px] text-neutral-400">Skor Beli / Jual</div>
          <div className="text-lg font-bold"><span className="text-[#137333]">{a.scoreBuy}</span> / <span className="text-[#c5221f]">{a.scoreSell}</span></div>
        </div>
      </div>

      {a.strong && (
        <div className="badge badge-live text-sm">Sinyal KUAT</div>
      )}

      <div>
        <div className="text-[13px] font-semibold text-neutral-500 mb-1">Bias</div>
        <Row label="D1 (harian)" value={a.bias.d1 === "up" ? "Naik" : a.bias.d1 === "down" ? "Turun" : "—"} />
        <Row label="HTF (H4)" value={a.bias.htf === "up" ? "Naik" : a.bias.htf === "down" ? "Turun" : "—"} />
        <Row label="Chart (EMA)" value={a.bias.chart === "up" ? "Naik" : a.bias.chart === "down" ? "Turun" : "—"} />
        <Row label="Sesi (WIB)" value={a.session} />
        <Row label="Kill Zone" value={a.kill ?? "Tidak aktif"} />
      </div>

      <div>
        <div className="text-[13px] font-semibold text-neutral-500 mb-1">Indikator</div>
        <Row label="Harga" value={fmtPrice(a.price)} strong />
        <Row label="EMA20 / 50 / 200" value={`${fmtPrice(a.ema.e20)} / ${fmtPrice(a.ema.e50)} / ${fmtPrice(a.ema.e200)}`} />
        <Row label="RSI (14)" value={fmtNum(a.rsi, 1)} />
        <Row label="MACD histogram" value={a.macdHist > 0 ? `+${fmtNum(a.macdHist)}` : fmtNum(a.macdHist)} />
        <Row label="ATR (14)" value={fmtNum(a.atr, 3)} />
        <Row label="VWAP" value={fmtPrice(a.vwap)} />
        <Row label="Pivot" value={fmtPrice(a.pivot.pivot)} />
        <Row label="PDH / PDL" value={`${fmtPrice(a.pivot.pdh)} / ${fmtPrice(a.pivot.pdl)}`} />
        <Row label="PWH / PWL" value={`${fmtPrice(a.pivot.pwh)} / ${fmtPrice(a.pivot.pwl)}`} />
      </div>

      {a.trade && (
        <div>
          <div className="text-[13px] font-semibold text-neutral-500 mb-1">Rencana Trade (saldo {fmtNum(balance)} · risiko {riskPct}%)</div>
          <Row label="Entry" value={fmtPrice(a.trade.entry)} strong />
          <Row label="Stop Loss (SL)" value={fmtPrice(a.trade.sl)} />
          <Row label="TP1 (1.5R)" value={fmtPrice(a.trade.tp1)} />
          <Row label="TP2 (2.5R)" value={fmtPrice(a.trade.tp2)} />
          <Row label="TP3 (3.5R)" value={fmtPrice(a.trade.tp3)} />
          <Row label="Lot (min 0.01)" value={fmtNum(a.trade.lot, 2)} strong />
          <Row label="Risiko (Rp)" value={fmtNum(a.trade.risk)} />
        </div>
      )}
    </div>
  );
}

export const tradeTime = fmtTime;
