# QA UPGRADE — Moona (18 Nov 2026) — XAU Pro

Repo: /home/mada/trading-ayah-app · Commit: 6197fca (Upgrade XAU Pro: rename brand, custom session jam, strategi interaktif chart)
Server: PORT=3250 (npm start). Uji: Dashboard /, /chart/XAUUSD, /pengaturan.

## Hasil Uji

| No | Uji | Hasil | Bukti |
|----|-----|-------|-------|
| 1 | Nama baru | PASS | title tab = "XAU Pro — XAUUSD & Forex"; brand navbar "XAU Pro" tampil di /, /chart/XAUUSD, /pengaturan. Teks 'Trading Ayah' TIDAK tampil di innerText ketiga page (0 match). |
| 2 | Strategi chart | PASS | 4 tombol ada: Skor Pro, Pullback Tren, Breakout-Retest, Pantulan Level. Panel kanan berubah per strategi: Skor Pro → "Skor Beli / Jual" (badge SELL + rencana Entry/SL/TP); Pullback Tren → "Pullback Tren"; Breakout-Retest → "Breakout-Retest"; Pantulan Level → "Pantulan Level". Checklist ✓/✗ tampil untuk 3 strategi setup. Console Tanpa error. |
| 2b | Order harga strategi aktif | PASS | Strategi aktif = Skor Pro (SELL, ada rencana penuh; 3 lainnya "Belum memenuhi syarat"). SELL order benar: SL 3.798,78 > Entry 3.775,90 > TP1 3.741,58 > TP2 3.718,70 > TP3 3.695,82. |
| 3 | Sesi custom | PASS | WIB uji 14:22; KZ London awal aktif (label "Kill Zone London aktif"). Ubah KZ London ke 23:50–23:51 → jam uji di luar rentang → label KZ aktif hilang, Dashboard berubah sesuai setting. Reset → KZ London kembali 14:00–17:00. Saldo 1.000 & risiko 1% tetap utuh (tidak terhapus). |
| 4 | Mobile 390x844 | PASS | scrollWidth / = 390, /chart/XAUUSD = 390, /pengaturan = 390 (semua ≤ 390). |
| 5 | Data live vs gold-api | PASS | biquote label=LIVE, harga XAUUSD 3.773,951 vs https://api.gold-api.com/price/XAU 3.775,620 (menit sama 07:24Z) → selisih 0.044% (< 0.5%). |

## VONIS: SIAP DEPLOY ULANG
