"use client";
import { useEffect, useState } from "react";
import { wibClock, wibHm } from "@/lib/format";
import { sessionLabelCustom, killZoneCustom } from "@/lib/sessions";
import { useSettings } from "@/components/useSettings";

export default function SessionClock() {
  const [now, setNow] = useState("--:--:--");
  const [hm, setHm] = useState(0);
  const [settings] = useSettings();

  useEffect(() => {
    const tick = () => {
      setNow(wibClock());
      setHm(wibHm());
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const sesi = sessionLabelCustom(hm, settings.sessions);
  const kill = killZoneCustom(hm, settings.sessions);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="card px-4 py-2 flex items-center gap-3">
        <div>
          <div className="text-[12px] uppercase tracking-wide text-neutral-400">Waktu WIB</div>
          <div className="text-xl font-bold tabular-nums">{now}</div>
        </div>
        <div className="h-8 w-px bg-neutral-200" />
        <div className="text-sm font-semibold text-neutral-700">
          Sesi: <span className="text-black">{sesi}</span>
        </div>
      </div>
      {kill && (
        <div className="badge badge-up text-sm px-3 py-2">
          Kill Zone {kill} aktif
        </div>
      )}
    </div>
  );
}
