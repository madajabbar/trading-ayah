# QA ULANG — Trading Ayah (18 Nov 2026)

Server: PORT=3250 npm start (commit 4d7d86d). Playwright + curl.

## 1. Mobile 390x844 — scrollWidth per halaman
| Halaman | scrollWidth | elemen right>391 | maxRight |
|---|---|---|---|
| / | 390 | 0 | 390 |
| /chart/XAUUSD | 390 | 0 | 390 |
| /sinyal | 390 | 0 | 390 |
| /kalkulator | 390 | 0 | 390 |
| /pengaturan | 390 | 0 | 390 |

## 2. Field source /api/analysis
| Simbol | HTTP | source | JSON valid |
|---|---|---|---|
| XAUUSD tf=60 | 200 | yahoo | ya |
| EURUSD tf=15m | 200 | yahoo | ya |

Field lama utuh: direction, strong, price, atr, bias, scoreBuy/scoreSell.

## 3. Regresi desktop
- Dashboard: 6 pair harga tampil (contoh XAUUSD 3.771,38).
- /chart/XAUUSD: canvas 960x392, 1753 unique colors (>500) → chart terlukis. Panel analisa tampil (direction=SELL, skor ada).
- Error console: 0 error (dashboard & chart).

## VONIS: SIAP DEPLOY
Alasan: 3/3 butir PASS; semua scrollWidth=390, over391=0; source ada & JSON valid; chart terlukis; tanpa error console. (Catatan non-blokir: kunci literal skor/sinyal pakai scoreBuy/scoreSell; set WEBHOOK_SECRET saat deploy.)
