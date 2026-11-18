# XAU Pro

Dashboard trading **XAUUSD & Forex** untuk Ayah — desain bersih ala Apple HIG, font besar, bahasa Indonesia. Bukan HUD sci-fi neon. Tagline: _Sinyal Emas & Forex untuk Ayah_.

## Fitur
- **Dashboard**: watchlist 6 pair (XAUUSD, EURUSD, GBPUSD, USDJPY, AUDUSD, DXY) — harga live, %ubah, skor mini, bias; jam sesi WIB live + indikator Kill Zone (jam bisa di-custom di Pengaturan); banner sinyal kuat terakhir.
- **Chart**: candlestick + EMA20/50/200, panel analisa lengkap (bias D1/HTF/chart, RSI, MACD, ATR, skor, tabel Entry/SL/TP1–3/Lot/Risiko), pemilih TF M5/M15/H1/H4/D1, mode Scalping/Intraday/Swing, dan **strategi interaktif**: Skor Pro, Pullback Tren, Breakout-Retest, Pantulan Level — tiap strategi menyesuaikan chart & panel checklist plus Entry/SL/TP bila aktif.
- **Sinyal**: riwayat webhook masuk + internal.
- **Kalkulator**: kalkulator lot mandiri.
- **Pengaturan**: saldo & risiko% (localStorage), jam sesi & Kill Zone custom (localStorage), webhook masuk (templat alert TradingView), webhook keluar Telegram/Discord.

## Sumber Data (jujur)
| Sumber | Dipakai untuk | Label |
|--------|---------------|-------|
| biquote (tanpa key) | harga live semua pair | LIVE |
| gold-api.com (tanpa key) | fallback Emas | DELAYED |
| Yahoo Finance (dengan User-Agent) | candles (OHLCV) | DELAYED |
| TwelveData (tanpa key) | opsional via env `TWELVE_DATA_API_KEY` | — |

Detail & verifikasi live: lihat [`HASIL_RISET_DATA.md`](HASIL_RISET_DATA.md).

## Endpoint API
| Method | Path | Keterangan |
|--------|------|-------------|
| GET | `/api/candles?symbol=&tf=` | Candle dari Yahoo (cache 25 dtk) |
| GET | `/api/quotes` | Harga kini semua pair (label LIVE/DELAYED) |
| GET | `/api/analysis?symbol=&tf=&balance=&risk=` | Mesin analisa server-side |
| POST | `/api/webhook/tradingview` | Webhook masuk TradingView |
| GET | `/api/signals` | Riwayat sinyal |

## Webhook TradingView (masuk)
- Endpoint: `POST /api/webhook/tradingview`
- Validasi secret vs env `WEBHOOK_SECRET`. Tanpa env (dev), semua diterima.
- Respons < 3 dtk, maks 100 sinyal tersimpan (Upstash Redis bila env `UPSTASH_REDIS_REST_URL`+`TOKEN` ada, selain itu in-memory).

> **Catatan jujur**: webhook TradingView membutuhkan paket TradingView berbayar (**Essential+**) dan verifikasi 2FA. Jalur gratis utama = mesin analisa internal app ini (tombol "Perbarui" di halaman Chart) + webhook keluar ke Telegram/Discord.

## Webhook Keluar (Telegram/Discord)
- Dikonfigurasi di halaman Pengaturan (tersimpan di localStorage, tidak pernah dikirim ke server).
- Sinyal kuat baru otomatis dikirim sekali per pair per timeframe (anti-spam).

## Jam Sesi Custom (catatan jujur)
Jam sesi & Kill Zone yang diedit di Pengaturan **hanya berlaku untuk tampilan sesi & kill zone di perangkat ini** (localStorage). Mesin skor server tetap memakai jam default.

## Pengembangan
```bash
npm install
cp .env.example .env.local   # isi WEBHOOK_SECRET
npm run dev
npm run build                 # wajib lulus
```
