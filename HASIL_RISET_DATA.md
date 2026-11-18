# HASIL RISET DATA — Trading Ayah

Verifikasi LIVE dilakukan pada **18 Nov 2026 ±13:45 WIB** (UTC+7). Semua memakai `curl`.

## Ringkasan Status Sumber

| # | Sumber | Endpoint | Status HTTP | Real-time? | Catatan |
|---|--------|----------|-------------|------------|---------|
| 1 | **biquote** | `GET /api/XAUUSD` dan `GET /api/latest?symbols=...` | **200** | **YA (LIVE)** | Tanpa key. Feed MetaTrader5 (Broker 1). Bid/Ask/mid/spread, `quoteAgeSeconds:0`, `marketState:"open"`, `stale:false`. |
| 2 | **gold-api.com** | `GET /api/price/XAU` | **200** | Dekat-live (beberapa detik) | Tanpa key. `price`, `updatedAtReadable:"a few seconds ago"`. Hanya logam (XAU). |
| 3 | **Yahoo Finance** | `GET /v8/finance/chart/GC=F?interval=15m&range=5d` | **200** | **DELAYED (candle)** | Butuh header `User-Agent` (tanpa UA → HTTP 429 Edge). Sumber candle. `regularMarketPrice`, OHLCV. |
| 4 | **Binance** | `GET /api/v3/ticker/price?symbol=PAXGUSDT` | **000 (gagal)** | — | Tidak merespons (timeout/koneksi). **DICORET** sebagai sumber. |
| 5 | **TwelveData** | — | — | — | Free 800 kredit/hari. **TIDAK didaftarkan** (sesuai instruksi). Upgrade opsional via env `TWELVE_DATA_API_KEY`. |

## Detail per Sumber

### 1. biquote (PRIMER — live quotes semua pair)
- Base: `https://biquote.io`
- Endpoint single: `GET /api/XAUUSD` (ganti simbol), multi: `GET /api/latest?symbols=XAUUSD&symbols=EURUSD&symbols=GBPUSD`
- Tanpa API key. HTTP 200.
- Contoh field (XAUUSD):
```json
{"symbol":"XAUUSD","bid":3780.265,"ask":3780.433,"last":0.0,"volume":0,
 "timestamp":"2026-11-18T06:43:54Z","source":"MetaTrader 5 (Broker 1)","exchange":"OTC",
 "high":3849.416,"low":3775.879,"direction":"UP","dayDiffPercent":-2.1374,
 "description":"Gold vs US Dollar","spread":0.168,"mid":3780.349,
 "stale":false,"quoteAgeSeconds":0,"marketState":"open"}
```
- Semua 6 pair terverifikasi HTTP 200: XAUUSD, EURUSD, GBPUSD, USDJPY, AUDUSD, DXY.
- **WebSocket SignalR**: hub `/hubs/tick` ada. Negotiate berhasil:
  - `POST /hubs/tick/negotiate?negotiateVersion=1` → 200, JSON berisi `connectionId`, `connectionToken`, `availableTransports` (WebSockets/SSE/LongPolling). Client SignalR (browser) bisa subscribe tick realtime.
- Label jujur: sumber ini feed broker MT5 live → label **LIVE**.

### 2. gold-api.com (fallback XAU)
- `GET https://api.gold-api.com/price/XAU`, tanpa key, HTTP 200.
- Field: `{"currency":"USD","exchangeRate":1.0,"name":"Gold","price":3781.05,"symbol":"XAU","updatedAt":"2026-11-18T06:44:00Z","updatedAtReadable":"a few seconds ago"}`
- Hanya logam (XAU), bukan forex. Dipakai fallback XAU saja.

### 3. Yahoo Finance (sumber CANDLE, delayed)
- `GET https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=15m&range=5d`
- **WAJIB header `User-Agent`** (mis. `Mozilla/5.0`) — tanpa itu kena HTTP 429 `Edge: Too Many Requests`.
- HTTP 200 dengan UA. Meta: `regularMarketPrice`, `exchangeName:"CMX"`, `instrumentType:"FUTURE"`, `gmtoffset:-18000` (EST). OHLCV di `chart.result[0].indicators.quote`.
- Mapping: XAUUSD→`GC=F`, EURUSD→`EURUSD=X`, GBPUSD→`GBPUSD=X`, USDJPY→`USDJPY=X`, AUDUSD→`AUDUSD=X`, DXY→`DX-Y.NYB`.
- Data pasar futures/forex Yahoo = **DELAYED** (bukan tick broker). Label jujur: **DELAYED**.

### 4. Binance (MATI — dicoret)
- `GET https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT` → timeout/gagal (000). Ping & time endpoint juga gagal. Tidak dipakai.

### 5. TwelveData (opsional)
- Free 800 kredit/hari. Tidak mendaftar akun per instruksi. Upgrade opsional: set `TWELVE_DATA_API_KEY` di env. Dokumentasi saja.

## Urutan Fallback (dari yang TERBUKTI merespons)
1. **Quotes live**: biquote (semua pair) → gold-api (hanya XAU) → Yahoo candle terakhir (label DELAYED).
2. **Candles**: Yahoo (dengan UA; cache 20–30 dtk di server).
3. Binance dicoret. TwelveData opsional bila ada key.

## Aturan kejujuran UI
- DILARANG menampilkan harga karangan/sim sebagai live.
- Label sumber wajib: **LIVE** (biquote), **DELAYED** (Yahoo), fallback ditulis apa adanya.
