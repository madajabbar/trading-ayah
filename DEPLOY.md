# Deploy — Trading Ayah

## Status: BLOCKER (perlu Moona/connector)

- **Vercel CLI tidak tersedia** di mesin ini (`vercel` bukan ditemukan) dan **tidak ada token Vercel** (`~/.vc` kosong).
- Tidak ada URL live asli yang bisa dicatat (DILARANG mengarang URL).
- Langkah deploy oleh Moona via connector: `vercel --prod` dari repo ini, lalu set env dari `.env.example`.

## Langkah deploy (untuk Moona/connector)
1. `vercel link` ke project Vercel (atau `vercel --prod`).
2. Set env (jangan commit token/secret):
   - `WEBHOOK_SECRET` (wajib, string acak panjang)
   - `TWELVE_DATA_API_KEY` (opsional)
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (opsional)
3. `vercel --prod`
4. Catat URL asli di sini.

## Catatan
- `npm run build` **LULUS** lokal (Next.js 16).
- Aplikasi bisa dijalankan lokal: `PORT=3250 npm start` (port default 3000 dipakai service lain).
- Semua sumber data tanpa key; satu-satunya secret adalah `WEBHOOK_SECRET` untuk webhook masuk.
