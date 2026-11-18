"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import { useSettings } from "@/components/useSettings";
import { SESSION_DEFAULTS, SessionSettings } from "@/lib/sessions";

const TEMPLATE = `{
  "secret": "GANTI_SECRET",
  "symbol": "XAUUSD",
  "timeframe": "H1",
  "signal": "BUY",
  "score": 82,
  "price": 3780.5,
  "sl": 3755.0,
  "tp1": 3818.0,
  "tp2": 3843.0,
  "tp3": 3868.0,
  "time": "{{timenow}}"
}`;

export default function PengaturanPage() {
  const [settings, save] = useSettings();
  const [status, setStatus] = useState("");

  return (
    <div className="flex-1">
      <Nav />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="h1">Pengaturan</h1>

        <div className="card p-6 space-y-4">
          <h2 className="h2">Saldo & Risiko</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-sm text-neutral-500">Saldo (Rp)</span>
              <input type="number" value={settings.balance} onChange={(e) => save({ ...settings, balance: Number(e.target.value) })} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-neutral-500">Risiko per trade (%)</span>
              <input type="number" step="0.1" value={settings.riskPct} onChange={(e) => save({ ...settings, riskPct: Number(e.target.value) })} />
            </label>
          </div>
          <div className="text-[12px] text-neutral-400">Disimpan lokal di browser (localStorage).</div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="h2">Jam Sesi & Kill Zone (WIB)</h2>
            <button onClick={() => save({ ...settings, sessions: SESSION_DEFAULTS })} className="badge text-sm cursor-pointer bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
              Reset ke Default
            </button>
          </div>
          <div className="space-y-3">
            {([
              ["Sesi Asia", "asia"],
              ["Sesi London", "london"],
              ["Sesi New York", "newyork"],
              ["Kill Zone London", "killLondon"],
              ["Kill Zone New York", "killNewyork"],
            ] as [string, keyof SessionSettings][]).map(([label, key]) => {
              const r = settings.sessions[key];
              return (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-neutral-600 w-36">{label}</span>
                  <div className="flex items-center gap-2">
                    <input type="time" value={r.start}
                      onChange={(e) => save({ ...settings, sessions: { ...settings.sessions, [key]: { ...r, start: e.target.value } } })} />
                    <span className="text-neutral-400">—</span>
                    <input type="time" value={r.end}
                      onChange={(e) => save({ ...settings, sessions: { ...settings.sessions, [key]: { ...r, end: e.target.value } } })} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-[12px] text-neutral-400 leading-relaxed">
            Jam custom berlaku untuk tampilan sesi &amp; kill zone di perangkat ini; mesin skor server memakai jam default.
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="h2">Webhook Masuk (TradingView)</h2>
          <div className="text-sm text-neutral-600 space-y-2">
            <p>
              Endpoint: <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-[13px]">POST /api/webhook/tradingview</code>
            </p>
            <p>
              Secret: diatur via env <code className="bg-neutral-100 px-1.5 py-0.5 rounded">WEBHOOK_SECRET</code> di server. Tanpa env (mode dev), semua payload diterima.
            </p>
            <p className="text-[13px] text-neutral-400">
              Catatan jujur: Webhook TradingView membutuhkan paket TradingView berbayar (Essential+) dan verifikasi 2FA. Jalur gratis utama app ini adalah mesin analisa internal (tombol "Perbarui" di halaman Chart) + webhook keluar ke Telegram/Discord di bawah.
            </p>
          </div>
          <div>
            <div className="text-[13px] font-semibold text-neutral-500 mb-1">Templat alert (siap copy)</div>
            <textarea readOnly value={TEMPLATE} rows={10} className="w-full font-mono text-[13px] bg-neutral-50 border border-neutral-200 rounded-xl p-3" />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="h2">Webhook Keluar (Telegram / Discord)</h2>
          <div className="grid grid-cols-1 gap-4">
            <label className="space-y-1">
              <span className="text-sm text-neutral-500">Telegram (bot API URL)</span>
              <input type="text" placeholder="https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<ID>"
                value={settings.outgoing.telegram}
                onChange={(e) => save({ ...settings, outgoing: { ...settings.outgoing, telegram: e.target.value } })} />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-neutral-500">Discord (webhook URL)</span>
              <input type="text" placeholder="https://discord.com/api/webhooks/..."
                value={settings.outgoing.discord}
                onChange={(e) => save({ ...settings, outgoing: { ...settings.outgoing, discord: e.target.value } })} />
            </label>
          </div>
          <div className="text-[12px] text-neutral-400">
            Sinyal kuat baru otomatis dikirim sekali per pair per timeframe (anti-spam) saat halaman Chart dimuat dan ditemukan sinyal kuat. URL tersimpan lokal, tidak pernah dikirim ke server.
          </div>
          <button onClick={() => { save(settings); setStatus("Tersimpan ✓"); setTimeout(() => setStatus(""), 2000); }} className="btn btn-primary">
            Simpan Pengaturan
          </button>
          {status && <span className="text-sm text-[#137333]">{status}</span>}
        </div>
      </main>
    </div>
  );
}
