"use client";
import { useEffect, useState } from "react";
import { AnalysisResult } from "@/lib/analysis";

export default function MiniAnalysis({ symbol }: { symbol: string }) {
  const [a, setA] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    let on = true;
    fetch(`/api/analysis?symbol=${symbol}&tf=H1&balance=1000&risk=1`)
      .then((r) => r.json())
      .then((j) => { if (on && !j.error) setA(j); })
      .catch(() => {});
    return () => { on = false; };
  }, [symbol]);

  if (!a) return null;

  const dir = a.direction;
  const qqe = a.qqe?.state;
  return (
    <div className="mt-2 flex items-center gap-2 text-[12px]">
      <span className={`badge ${dir === "BUY" ? "badge-up" : dir === "SELL" ? "badge-down" : "badge-delayed"}`}>
        {dir === "NEUTRAL" ? "Netral" : dir}
      </span>
      {qqe && (
        <span className={`badge ${qqe === "bull" ? "badge-up" : qqe === "bear" ? "badge-down" : "badge-delayed"}`} title="Momentum QQE Mod">
          {qqe === "bull" ? "▲" : qqe === "bear" ? "▼" : "◆"}
        </span>
      )}
      <span className="text-neutral-400">B {a.scoreBuy}</span>
      <span className="text-neutral-400">J {a.scoreSell}</span>
    </div>
  );
}
