"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import TradingChart from "@/components/TradingChart";
import AnalysisPanel from "@/components/AnalysisPanel";
import StrategyPanel from "@/components/StrategyPanel";
import { useSettings } from "@/components/useSettings";
import { alreadySent, sendOutgoing } from "@/lib/outgoing";
import { AnalysisResult } from "@/lib/analysis";
import { Candle } from "@/lib/market";
import { TF, TF_LIST, TF_LABEL, MODES, Mode, DEFAULT_MODE } from "@/lib/config";
import { STRATEGIES, StrategyId, computeStrategy } from "@/lib/strategies";
import SessionClock from "@/components/SessionClock";

export default function ChartClient({ symbol }: { symbol: string }) {
  const [tf, setTf] = useState<TF>("H1");
  const [mode, setMode] = useState<Mode>(DEFAULT_MODE);
  const [strat, setStrat] = useState<StrategyId>("skor");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [err, setErr] = useState("");
  const [settings] = useSettings();
  const [sendMsg, setSendMsg] = useState("");

  const load = useCallback(async () => {
    setErr("");
    try {
      const [cr, ar] = await Promise.all([
        fetch(`/api/candles?symbol=${symbol}&tf=${tf}`),
        fetch(`/api/analysis?symbol=${symbol}&tf=${tf}&balance=${settings.balance}&risk=${settings.riskPct}`),
      ]);
      const cj = await cr.json();
      const aj = await ar.json();
      if (cj.error) setErr(cj.error);
      else setCandles(cj.candles || []);
      if (aj.error) setErr((e) => e || aj.error);
      else setAnalysis(aj);
    } catch (e: any) {
      setErr(e.message || "gagal memuat");
    }
  }, [symbol, tf, settings.balance, settings.riskPct]);

  useEffect(() => { load(); }, [load]);

  const strategy = useMemo(() => {
    if (!analysis || !candles.length) return null;
    return computeStrategy(strat, { a: analysis, candles });
  }, [strat, analysis, candles]);

  return (
    <div className="flex-1">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="h1">{symbol}</h1>
          <SessionClock />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {TF_LIST.map((t) => (
            <button key={t} onClick={() => setTf(t)}
              className={`badge text-sm cursor-pointer ${tf === t ? "bg-black text-white" : "bg-neutral-100 text-neutral-600"}`}>
              {TF_LABEL[t]}
            </button>
          ))}
          <div className="w-px h-6 bg-neutral-200" />
          {MODES.map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`badge text-sm cursor-pointer ${mode === m ? "bg-blue-500 text-white" : "bg-neutral-100 text-neutral-600"}`}>
              {m}
            </button>
          ))}
          <button onClick={load} className="btn ml-auto">Perbarui</button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STRATEGIES.map((s) => (
            <button key={s.id} onClick={() => setStrat(s.id)}
              className={`badge text-sm px-3 py-1.5 cursor-pointer ${strat === s.id ? "bg-black text-white" : "bg-neutral-100 text-neutral-600"}`}>
              {s.label}
            </button>
          ))}
        </div>

        {err && (
          <div className="card p-4 text-sm text-[#c5221f]">Sumber data gagal: {err} — coba lagi sebentar.</div>
        )}

        <div className="card p-3">
          <TradingChart candles={candles} strategy={strat} overlay={strategy ? strategy.chart : { emas: ["e20", "e50", "e200"], priceLines: [], markers: [] }} />
          <div className="px-2 pt-1 text-[12px] text-neutral-400">
            Sumber candle: Yahoo Finance (DELAYED) · mode: {mode}
          </div>
        </div>

        {strategy && strategy.id === "skor" && analysis && <AnalysisPanel a={analysis} balance={settings.balance} riskPct={settings.riskPct} />}
        {strategy && strategy.id !== "skor" && <StrategyPanel r={strategy} balance={settings.balance} riskPct={settings.riskPct} />}

        {analysis?.strong && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              className="btn btn-primary"
              disabled={alreadySent(symbol, tf)}
              onClick={async () => { setSendMsg(await sendOutgoing(analysis)); }}
            >
              {alreadySent(symbol, tf) ? "Sudah dikirim ✓" : "Kirim sinyal ke Telegram/Discord"}
            </button>
            {sendMsg && <span className="text-sm text-neutral-500">{sendMsg}</span>}
          </div>
        )}
      </main>
    </div>
  );
}
