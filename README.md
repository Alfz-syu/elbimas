# Elbimas — Aplikasi Pengelola Keuangan Pribadi

Website pengelola keuangan pribadi gratis berbahasa Indonesia: catat pemasukan & pengeluaran, kelola banyak dompet & mata uang, atur anggaran bulanan, target tabungan, utang-piutang, transaksi berulang, dan laporan keuangan otomatis. Bisa di-install di HP sebagai PWA.

## Fitur

- **Autentikasi** — register/login dengan session JWT httpOnly; area dashboard terproteksi middleware.
- **Multi-dompet & multi-mata uang** — saldo real-time per dompet; 20+ mata uang; transfer antar dompet (termasuk beda mata uang dengan fee).
- **Transaksi** — CRUD dengan filter, pencarian, pagination; kategori income/expense yang bisa dikustom.
- **Kurs** — sinkron otomatis dari [Frankfurter](https://frankfurter.dev) (fallback: [fawazahmed0 exchange-api](https://github.com/fawazahmed0/exchange-api)) atau kurs manual; caching per hari; aplikasi tetap berfungsi tanpa kedua API.
- **Dashboard & laporan** — total saldo terkonversi ke mata uang utama, grafik arus kas harian, breakdown per kategori.
- **Anggaran bulanan** — batas per kategori/total dengan progress bar dan indikator over-budget.
- **Target tabungan** — kontribusi bertahap, status tercapai otomatis.
- **Utang-piutang** — riwayat pembayaran, status open/partial/settled otomatis.
- **Transaksi berulang** — harian/mingguan/bulanan/tahunan × interval, runner idempotent dengan catch-up periode terlewat.
- **Halaman publik + SEO** — landing, fitur, blog, FAQ, robots.txt, sitemap.xml, JSON-LD.
- **PWA** — manifest + service worker + halaman offline; bisa dipasang ke home screen.

## Teknologi

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · shadcn/ui · Kysely + mysql2 (MySQL 8) · Zod · decimal.js · Recharts · jose + bcryptjs · Vitest

## Menjalankan Secara Lokal

Prasyarat: **Node.js 20+** dan **MySQL 8**.

```bash
# 1. Install dependency
npm install

# 2. Salin env dan sesuaikan kredensial MySQL
cp .env.example .env

# 3. Buat database lalu import skema + seed mata uang
mysql -u root -e "CREATE DATABASE elbimas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root elbimas < db/schema.sql
mysql -u root elbimas < db/seed.sql

# 4. Jalankan
npm run dev
```

Buka http://localhost:3000 — daftar akun baru, lalu mulai catat.

> Import SQL juga bisa lewat phpMyAdmin/HeidiSQL: buat database `elbimas`, lalu import `db/schema.sql` diikuti `db/seed.sql`.

## Environment Variables

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DB_HOST` | ✅ | Host MySQL (lokal/Hostinger biasanya `localhost`) |
| `DB_PORT` | ✅ | Port MySQL (default `3306`) |
| `DB_USER` | ✅ | User MySQL |
| `DB_PASSWORD` | ✅ | Password MySQL |
| `DB_NAME` | ✅ | Nama database (mis. `elbimas`) |
| `JWT_SECRET` | ✅ | String acak panjang untuk menandatangani session |
| `CRON_SECRET` | ✅ | Rahasia header `x-cron-secret` untuk memicu `POST /api/recurring/run` |
| `NEXT_PUBLIC_SITE_URL` | ✅ (produksi) | URL domain produksi — dipakai canonical, sitemap, Open Graph |
| `FX_PRIMARY_URL` | ⬜ | Override endpoint kurs primary (default Frankfurter) |

Lihat `.env.example` untuk templat lengkap.

## Test

```bash
npm test
```

Unit test (Vitest) mencakup logika kritikal: aritmetika & konversi uang (decimal.js, bebas floating-point error), status utang otomatis, dan penjadwalan transaksi berulang (termasuk clamp akhir bulan & tahun kabisat).

## Deploy ke Hostinger

1. **Push repo ke GitHub.**
2. Di hPanel, buat **MySQL database + user**, catat kredensialnya.
3. Buka **phpMyAdmin** → pilih database → tab **Import** → unggah `db/schema.sql`, lalu `db/seed.sql`.
4. Di hPanel **Node.js / Web Apps Hosting**: hubungkan repo GitHub (auto-build) atau upload ZIP proyek.
5. Set **environment variables** sesuai tabel di atas (`DB_HOST` biasanya `localhost`, port `3306`; isi `NEXT_PUBLIC_SITE_URL` dengan domainmu, mis. `https://domainkamu.com`).
6. Build command: `npm run build` — start command: `npm start`. (Aplikasi ini server-rendered; **bukan** static export.)
7. Pastikan SSL aktif (gratis di Hostinger) — dibutuhkan untuk PWA.

### Menjalankan Transaksi Berulang (Recurring)

Runner dieksekusi lewat `POST /api/recurring/run`. Dua opsi:

- **Cron / uptime service (disarankan)** — panggil sekali sehari dengan header rahasia:

  ```bash
  curl -X POST https://domainkamu.com/api/recurring/run \
    -H "x-cron-secret: ISI_CRON_SECRET_KAMU"
  ```

  Bisa lewat cron job Hostinger, atau layanan uptime gratis (cron-job.org, UptimeRobot webhook). Endpoint idempotent — aman terpanggil berkali-kali dalam sehari.

- **Manual dari aplikasi** — tombol **"Jalankan Sekarang"** tersedia di halaman **Transaksi Berulang** dan **Pengaturan → Alat** (memproses milik user yang login saja).

## Struktur Proyek (ringkas)

```
db/                 schema.sql + seed.sql (import bersih ke MySQL 8 kosong)
src/app/(public)/   landing, fitur, blog, faq, tentang, kontak (SEO, prerender)
src/app/(dashboard)/dashboard, transactions, wallets, budgets, goals, debts,
                    recurring, settings (area privat, noindex)
src/app/api/        route handlers REST (Zod + error format konsisten)
src/server/         service layer (Kysely, aturan bisnis)
src/lib/            auth, money (decimal.js), validators, util
src/proxy.ts        proteksi route + security headers (konvensi Next 16)
public/sw.js        service worker PWA (manual, kompatibel Turbopack)
```

## Lisensi

Proyek pribadi/edukasi.
