"use client";
import { useCallback, useEffect, useState } from "react";
import { Quote } from "@/lib/market";

export function useQuotes(intervalMs = 25_000) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/quotes");
      const j = await r.json();
      if (j.quotes) setQuotes(j.quotes);
      setErr("");
    } catch (e: any) {
      setErr(e.message || "gagal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, intervalMs);
    return () => clearInterval(t);
  }, [load, intervalMs]);

  return { quotes, err, loading };
}
