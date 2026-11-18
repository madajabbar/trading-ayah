"use client";
import { useEffect, useState } from "react";
import { SESSION_DEFAULTS, SessionSettings } from "@/lib/sessions";
import { MomentumSource } from "@/lib/analysis";

export interface Settings {
  balance: number;
  riskPct: number;
  momentum: MomentumSource;
  outgoing: { telegram: string; discord: string };
  sessions: SessionSettings;
}

const KEY = "trading-ayah-settings";
const DEFAULTS: Settings = {
  balance: 1000,
  riskPct: 1,
  momentum: "qqe",
  outgoing: { telegram: "", discord: "" },
  sessions: SESSION_DEFAULTS,
};

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
