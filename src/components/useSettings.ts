"use client";
import { useEffect, useState } from "react";

export interface Settings {
  balance: number;
  riskPct: number;
  outgoing: { telegram: string; discord: string };
}

const KEY = "trading-ayah-settings";
const DEFAULTS: Settings = { balance: 1000, riskPct: 1, outgoing: { telegram: "", discord: "" } };

export function useSettings(): [Settings, (s: Settings) => void] {
  const [s, setS] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const save = (next: Settings) => {
    setS(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  return [s, save];
}
