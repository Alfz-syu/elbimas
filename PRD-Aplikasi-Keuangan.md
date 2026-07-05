# PRD & Build Prompt — Aplikasi Pengelola Keuangan (Multi-User)

> **Untuk:** Claude Code
> **Peran kamu:** Senior full-stack engineer. Bangun aplikasi ini dari nol sampai siap deploy, dengan kode bersih, teruji, dan mudah dirawat. Ikuti semua *constraint* di dokumen ini secara ketat — terutama bagian **Non-Negotiable Constraints**.

---

## 1. Ringkasan Produk

Aplikasi web untuk mengelola keuangan pribadi secara menyeluruh. Aplikasi bersifat **publik & multi-user**: siapa pun bisa mendaftar akun sendiri, dan setiap user hanya bisa melihat/mengelola datanya sendiri (data terisolasi per user). Aplikasi mendukung **multi-currency** (banyak mata uang) dengan laporan yang bisa dikonversi ke satu mata uang dasar (base currency) milik user.

**Modul inti:**
1. Catat pemasukan & pengeluaran + kategori.
2. Multi-dompet/rekening + transfer antar dompet (termasuk beda mata uang).
3. Budget bulanan + target tabungan (savings goals).
4. Utang-piutang + tagihan/transaksi berulang (recurring).
5. Laporan & grafik (dashboard analitik).

---

## 2. Non-Negotiable Constraints (WAJIB)

Ini adalah batasan yang tidak boleh dilanggar. Kalau ada keputusan teknis, prioritaskan aturan ini.

1. **Database = MySQL saja.** Target hosting (Hostinger Business/Cloud) hanya mendukung MySQL. Jangan pakai PostgreSQL/MongoDB/SQLite.
2. **JANGAN pakai Prisma.** Jangan pakai ORM yang punya sistem migration sendiri.
3. **Akses DB pakai `mysql2` + `Kysely`** (query builder type-safe, bukan ORM). Type tabel ditulis manual di file TypeScript (lihat bagian 6), **tidak** di-generate dari koneksi DB saat build.
4. **Skema database berasal dari satu file `db/schema.sql`.** User akan meng-import file ini secara manual lewat phpMyAdmin. Jadi:
   - Semua tabel, index, dan constraint harus ada di `db/schema.sql`.
   - **Tidak boleh ada** proses auto-migrate / auto-create table saat aplikasi start.
   - File harus idempotent kalau memungkinkan (pakai `CREATE TABLE IF NOT EXISTS`).
5. **Deploy harus simpel.** Satu aplikasi Next.js saja (frontend + backend jadi satu, cukup 1x deploy). Jangan pisah jadi 2 service.
6. **Jangan pakai fitur yang butuh infra tambahan** untuk v1 (Redis, message queue, cron eksternal, S3, dsb). Kalau butuh scheduling (recurring), sediakan lewat endpoint yang bisa dipicu (lihat bagian 8).
7. **Semua uang disimpan sebagai `DECIMAL`**, tidak pernah `FLOAT`/`DOUBLE`. Di aplikasi, hitung uang dengan aman (integer/minor unit atau library decimal), tidak dengan floating point biasa.
8. **Otorisasi ketat.** Setiap query harus di-scope ke `user_id` dari sesi login. Tidak boleh ada endpoint yang membocorkan data user lain.

---

## 3. Tech Stack (sudah dikunci)

- **Framework:** Next.js (App Router) + TypeScript. Jalankan sebagai Node server (`next build` lalu `next start`). **Jangan** pakai static export (`output: 'export'`).
- **Styling/UI:** Tailwind CSS + shadcn/ui. Ikon: lucide-react.
- **Grafik:** Recharts.
- **SEO:** Next.js Metadata API + `app/sitemap.ts` + `app/robots.ts` + JSON-LD (lihat Bagian 10).
- **PWA:** Serwist (`@serwist/next`) atau `next-pwa` — pilih yang kompatibel dengan versi Next.js yang dipakai (lihat Bagian 11).
- **Database:** MySQL (InnoDB, `utf8mb4`).
- **DB access:** `mysql2` (driver) + `kysely` (query builder) + `kysely` MySQL dialect.
- **Validasi input:** Zod (validasi di setiap route handler).
- **Auth:** email + password. Password di-hash pakai `bcrypt` (atau `bcryptjs`). Sesi via **JWT di cookie httpOnly** (secure, sameSite=lax). Buat helper `getСurrentUser()` untuk server components & route handlers.
- **Form:** react-hook-form + zod resolver.
- **Tanggal/uang:** gunakan library ringan (mis. `date-fns`, dan `decimal.js` atau perhitungan minor-unit untuk uang).

> Jika ada kebutuhan library lain, pilih yang ringan dan populer, catat alasannya di README.

---

## 4. Struktur Proyek yang Diharapkan

```
/
├── db/
│   ├── schema.sql          # authoritative schema — user import via phpMyAdmin
│   └── seed.sql            # opsional: seed mata uang + demo data
├── src/
│   ├── app/
│   │   ├── (auth)/         # login, register
│   │   ├── (dashboard)/    # halaman setelah login
│   │   └── api/            # route handlers (REST)
│   ├── components/
│   ├── db/
│   │   ├── client.ts       # koneksi mysql2 pool + instance Kysely
│   │   └── schema-types.ts # tipe TypeScript untuk semua tabel (ditulis manual)
│   ├── lib/                # auth, currency, money, validation helpers
│   └── server/             # service layer (business logic per modul)
├── .env.example
├── README.md               # cara setup lokal + cara deploy ke Hostinger
└── package.json
```

Business logic ditaruh di **service layer** (`src/server/`), route handler tipis (validasi → panggil service → return JSON).

---

## 5. Skema Database (referensi otoritatif)

Buat `db/schema.sql` berdasarkan skema di bawah. Boleh disempurnakan (index tambahan, dsb) selama tetap konsisten dengan modul & constraint. Semua tabel: `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`.

**Prinsip uang & currency:**
- Setiap **wallet punya 1 mata uang**. Semua transaksi disimpan dalam mata uang wallet-nya.
- Setiap user punya **`base_currency`** untuk laporan.
- Di setiap transaksi simpan **`fx_rate_to_base`** (kurs ke base currency saat transaksi dibuat) supaya laporan bisa agregasi lintas mata uang tanpa perlu kurs historis rumit.
- Saldo wallet dihitung dari `initial_balance + Σ transaksi` (v1: hitung on-the-fly; boleh tambah kolom cache `cached_balance` yang di-update saat write).

```sql
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =========================================================
-- USERS & AUTH
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email          VARCHAR(255) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  name           VARCHAR(120) NOT NULL,
  base_currency  CHAR(3) NOT NULL DEFAULT 'IDR',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- CURRENCIES & EXCHANGE RATES
-- =========================================================
CREATE TABLE IF NOT EXISTS currencies (
  code    CHAR(3) NOT NULL,          -- 'IDR', 'USD', ...
  name    VARCHAR(60) NOT NULL,
  symbol  VARCHAR(8) NOT NULL,
  PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kurs referensi milik user (bisa diisi manual atau di-prefill dari API opsional)
CREATE TABLE IF NOT EXISTS exchange_rates (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  base_currency  CHAR(3) NOT NULL,
  quote_currency CHAR(3) NOT NULL,
  rate           DECIMAL(20,8) NOT NULL,   -- 1 base = rate quote
  rate_date      DATE NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rate (user_id, base_currency, quote_currency, rate_date),
  KEY idx_rate_lookup (user_id, base_currency, quote_currency, rate_date),
  CONSTRAINT fk_rate_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- WALLETS / ACCOUNTS
-- =========================================================
CREATE TABLE IF NOT EXISTS wallets (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          BIGINT UNSIGNED NOT NULL,
  name             VARCHAR(120) NOT NULL,
  type             ENUM('cash','bank','ewallet','credit_card','investment','other') NOT NULL DEFAULT 'cash',
  currency         CHAR(3) NOT NULL,
  initial_balance  DECIMAL(20,4) NOT NULL DEFAULT 0,
  color            VARCHAR(16) NULL,
  icon             VARCHAR(40) NULL,
  is_archived      TINYINT(1) NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wallets_user (user_id, is_archived),
  CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- CATEGORIES (income / expense, boleh punya parent)
-- =========================================================
CREATE TABLE IF NOT EXISTS categories (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(120) NOT NULL,
  type       ENUM('income','expense') NOT NULL,
  parent_id  BIGINT UNSIGNED NULL,
  color      VARCHAR(16) NULL,
  icon       VARCHAR(40) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_categories_user (user_id, type),
  CONSTRAINT fk_categories_user   FOREIGN KEY (user_id)   REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TRANSACTIONS (income / expense). Transfer punya tabel sendiri.
-- =========================================================
CREATE TABLE IF NOT EXISTS transactions (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          BIGINT UNSIGNED NOT NULL,
  wallet_id        BIGINT UNSIGNED NOT NULL,
  category_id      BIGINT UNSIGNED NULL,
  type             ENUM('income','expense') NOT NULL,
  amount           DECIMAL(20,4) NOT NULL,      -- selalu positif, arah ditentukan 'type'
  currency         CHAR(3) NOT NULL,            -- = currency wallet saat itu
  fx_rate_to_base  DECIMAL(20,8) NOT NULL DEFAULT 1, -- kurs ke base_currency user saat transaksi
  note             VARCHAR(255) NULL,
  transaction_date DATE NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tx_user_date (user_id, transaction_date),
  KEY idx_tx_wallet (wallet_id),
  KEY idx_tx_category (category_id),
  CONSTRAINT fk_tx_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_tx_wallet   FOREIGN KEY (wallet_id)   REFERENCES wallets(id)    ON DELETE CASCADE,
  CONSTRAINT fk_tx_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TRANSFERS antar wallet (mendukung beda mata uang)
-- =========================================================
CREATE TABLE IF NOT EXISTS transfers (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  from_wallet_id BIGINT UNSIGNED NOT NULL,
  to_wallet_id   BIGINT UNSIGNED NOT NULL,
  from_amount    DECIMAL(20,4) NOT NULL,       -- keluar dari from_wallet (currency from)
  to_amount      DECIMAL(20,4) NOT NULL,       -- masuk ke to_wallet (currency to)
  fee            DECIMAL(20,4) NOT NULL DEFAULT 0,
  note           VARCHAR(255) NULL,
  transfer_date  DATE NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transfer_user_date (user_id, transfer_date),
  CONSTRAINT fk_transfer_user FOREIGN KEY (user_id)        REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_transfer_from FOREIGN KEY (from_wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  CONSTRAINT fk_transfer_to   FOREIGN KEY (to_wallet_id)   REFERENCES wallets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- BUDGETS (per kategori, periode bulanan)
-- =========================================================
CREATE TABLE IF NOT EXISTS budgets (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  category_id  BIGINT UNSIGNED NULL,          -- NULL = budget total
  amount       DECIMAL(20,4) NOT NULL,
  currency     CHAR(3) NOT NULL,              -- biasanya = base_currency
  period_month CHAR(7) NOT NULL,             -- format 'YYYY-MM'
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_budget (user_id, category_id, period_month),
  CONSTRAINT fk_budget_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_budget_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- SAVINGS GOALS (target tabungan)
-- =========================================================
CREATE TABLE IF NOT EXISTS savings_goals (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  name           VARCHAR(120) NOT NULL,
  target_amount  DECIMAL(20,4) NOT NULL,
  current_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  currency       CHAR(3) NOT NULL,
  wallet_id      BIGINT UNSIGNED NULL,         -- opsional: dompet penampung
  target_date    DATE NULL,
  is_achieved    TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_goal_user (user_id),
  CONSTRAINT fk_goal_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_goal_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- DEBTS (utang = payable, piutang = receivable)
-- =========================================================
CREATE TABLE IF NOT EXISTS debts (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          BIGINT UNSIGNED NOT NULL,
  type             ENUM('payable','receivable') NOT NULL,
  counterparty     VARCHAR(120) NOT NULL,        -- nama orang/pihak
  principal_amount DECIMAL(20,4) NOT NULL,
  currency         CHAR(3) NOT NULL,
  due_date         DATE NULL,
  status           ENUM('open','partial','settled') NOT NULL DEFAULT 'open',
  note             VARCHAR(255) NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_debt_user (user_id, status),
  CONSTRAINT fk_debt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS debt_payments (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  debt_id      BIGINT UNSIGNED NOT NULL,
  user_id      BIGINT UNSIGNED NOT NULL,
  amount       DECIMAL(20,4) NOT NULL,
  wallet_id    BIGINT UNSIGNED NULL,           -- dompet sumber/tujuan pembayaran
  payment_date DATE NOT NULL,
  note         VARCHAR(255) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_debtpay_debt (debt_id),
  CONSTRAINT fk_debtpay_debt   FOREIGN KEY (debt_id)   REFERENCES debts(id)   ON DELETE CASCADE,
  CONSTRAINT fk_debtpay_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_debtpay_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- RECURRING TRANSACTIONS (transaksi/tagihan berulang)
-- =========================================================
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  wallet_id      BIGINT UNSIGNED NOT NULL,
  category_id    BIGINT UNSIGNED NULL,
  type           ENUM('income','expense') NOT NULL,
  amount         DECIMAL(20,4) NOT NULL,
  currency       CHAR(3) NOT NULL,
  frequency      ENUM('daily','weekly','monthly','yearly') NOT NULL,
  interval_count INT UNSIGNED NOT NULL DEFAULT 1,   -- tiap N frequency
  next_run_date  DATE NOT NULL,
  end_date       DATE NULL,
  note           VARCHAR(255) NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_recurring_due (is_active, next_run_date),
  CONSTRAINT fk_recur_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_recur_wallet   FOREIGN KEY (wallet_id)   REFERENCES wallets(id)    ON DELETE CASCADE,
  CONSTRAINT fk_recur_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**`db/seed.sql` (opsional):** isi tabel `currencies` dengan mata uang umum (IDR, USD, EUR, SGD, JPY, MYR, GBP, AUD, dst) beserta simbol. Boleh sediakan set kategori default yang di-copy ke user baru saat registrasi (lewat kode, bukan seed).

---

## 6. Layer Database (Kysely) — aturan

- `src/db/client.ts`: buat `mysql2` connection pool dari env, bungkus dengan `new Kysely({ dialect: new MysqlDialect({ pool }) })`. Export instance `db`.
- `src/db/schema-types.ts`: tulis **manual** interface `Database` berisi tipe semua tabel (sesuai schema di atas). Contoh pola:
  ```ts
  import { Generated, ColumnType } from 'kysely';
  export interface UsersTable {
    id: Generated<number>;
    email: string;
    password_hash: string;
    name: string;
    base_currency: string;
    created_at: ColumnType<Date, string | undefined, never>;
    updated_at: ColumnType<Date, string | undefined, never>;
  }
  // ... tabel lainnya
  export interface Database {
    users: UsersTable;
    currencies: CurrenciesTable;
    exchange_rates: ExchangeRatesTable;
    wallets: WalletsTable;
    categories: CategoriesTable;
    transactions: TransactionsTable;
    transfers: TransfersTable;
    budgets: BudgetsTable;
    savings_goals: SavingsGoalsTable;
    debts: DebtsTable;
    debt_payments: DebtPaymentsTable;
    recurring_transactions: RecurringTransactionsTable;
  }
  ```
- Semua operasi tulis yang melibatkan >1 tabel (mis. buat transfer, bayar utang) **wajib pakai transaction DB** (`db.transaction().execute(...)`).
- Setiap query **wajib** menyertakan filter `user_id`.

---

## 7. Autentikasi & Keamanan

- **Registrasi:** email unik + password (min 8 char). Hash pakai bcrypt (cost ≥ 10). Saat register, otomatis buat set kategori default + set `base_currency` pilihan user.
- **Login:** verifikasi, terbitkan JWT (berisi `userId`), simpan di cookie **httpOnly, secure, sameSite=lax**, umur mis. 7 hari. Sediakan refresh sederhana (perpanjang saat aktif) atau cukup umur 7 hari.
- **Logout:** hapus cookie.
- **Proteksi route:** middleware Next.js untuk mengarahkan user belum login dari area dashboard ke `/login`. Route handler API cek sesi & return 401 kalau tidak valid.
- **Keamanan wajib:** rate limit sederhana pada endpoint auth (mis. in-memory per IP), validasi semua input dengan Zod, jangan pernah balikan `password_hash`, escape/parametrized query (Kysely sudah aman), set security headers dasar.
- **Lupa password:** boleh diletakkan di *out of scope v1* (karena butuh SMTP), tapi siapkan struktur agar mudah ditambah. Catat di README.

---

## 8. API (REST route handlers)

Semua di bawah `/api`, kembalikan JSON, semua di-scope ke user login.

**Auth**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

**Wallets**
- `GET/POST /api/wallets`, `GET/PATCH/DELETE /api/wallets/:id`
- `GET /api/wallets/:id/balance` (saldo terkini)

**Categories**
- `GET/POST /api/categories`, `PATCH/DELETE /api/categories/:id`

**Transactions**
- `GET /api/transactions` (filter: date range, wallet, category, type, search, pagination)
- `POST /api/transactions`, `GET/PATCH/DELETE /api/transactions/:id`

**Transfers**
- `GET/POST /api/transfers`, `DELETE /api/transfers/:id`

**Budgets**
- `GET /api/budgets?month=YYYY-MM` (sertakan realisasi vs budget), `POST/PATCH/DELETE`

**Savings goals**
- `GET/POST /api/goals`, `PATCH/DELETE /api/goals/:id`, `POST /api/goals/:id/contribute`

**Debts**
- `GET/POST /api/debts`, `PATCH/DELETE /api/debts/:id`
- `POST /api/debts/:id/payments` (status otomatis: open/partial/settled)

**Recurring**
- `GET/POST /api/recurring`, `PATCH/DELETE /api/recurring/:id`
- `POST /api/recurring/run` — **eksekusi semua recurring yang jatuh tempo** (`next_run_date <= today`), buat transaksi aktual, lalu majukan `next_run_date`. Endpoint ini diamankan dengan header rahasia (`x-cron-secret` dari env) supaya bisa dipicu oleh cron Hostinger / Uptime service. Idempotent (aman dipanggil berkali-kali).

**Currency**
- `GET /api/currencies`
- `GET/POST /api/rates` — kurs manual milik user.
- `POST /api/rates/sync` — ambil kurs terbaru dari **API gratis TANPA API key** dan simpan ke `exchange_rates`. **Primary: Frankfurter** (`https://api.frankfurter.dev/v2/latest?base=USD&symbols=IDR,EUR,...`). **Fallback: fawazahmed0 exchange-api** (via jsDelivr CDN) untuk mata uang yang tidak tercakup Frankfurter (termasuk kripto). Wajib: panggil dari server (hindari CORS), caching per hari (kurs ECB update sekali/hari), dan aplikasi **tetap berfungsi dengan kurs manual** bila kedua API gagal. Tidak boleh ada API yang membutuhkan key/kartu kredit.

**Reports**
- `GET /api/reports/summary?month=YYYY-MM` — total income/expense/net (dikonversi ke base currency), cashflow harian, breakdown per kategori, saldo semua wallet.

---

## 9. Halaman / UX Frontend

Bahasa UI: **Indonesia**. Desain **wajib** mengikuti **Bagian 12 (Arahan Desain UI/UX)** — responsif di semua perangkat & tidak boleh terlihat "template AI".

Aplikasi punya **dua area**:
- **Area publik (bisa diindeks Google — lihat Bagian 10):** landing page, halaman fitur, tentang, blog/artikel, FAQ, kontak. Wajib server-rendered (SSR/SSG) dengan metadata lengkap dan `index, follow`.
- **Area privat (di balik login):** semua halaman dashboard di bawah ini, wajib `noindex, nofollow`.

Halaman dashboard (privat):
1. **Auth:** `/register`, `/login` (pilih base currency saat daftar).
2. **Dashboard:** ringkasan bulan berjalan — total saldo (base currency), income vs expense, grafik cashflow, breakdown kategori (pie/bar), progress budget, ringkasan utang-piutang jatuh tempo.
3. **Transactions:** list dengan filter & search + pagination; form tambah/edit (pilih wallet, kategori, tipe, jumlah, tanggal, catatan).
4. **Wallets:** kartu tiap dompet + saldo; form CRUD; tombol transfer antar dompet (dengan kalkulasi kurs bila beda mata uang).
5. **Budgets:** per bulan, progress bar realisasi vs budget, indikator over-budget.
6. **Goals:** kartu target tabungan + progress + tombol "tambah kontribusi".
7. **Debts:** tab utang/piutang, list + status, detail + riwayat pembayaran.
8. **Recurring:** list tagihan berulang + jadwal berikutnya + toggle aktif.
9. **Settings:** profil, ganti base currency, kelola kategori, kelola kurs manual.

**Detail multi-currency:** tampilkan angka dalam mata uang wallet-nya, dan di ringkasan/laporan tampilkan nilai terkonversi ke base currency (beri tanda bahwa itu hasil konversi). Format angka sesuai locale (pemisah ribuan).

---

## 10. SEO — Terindeks Google

**Tujuan:** halaman publik terindeks Google dan menargetkan kata kunci "website pengelola keuangan" beserta turunannya (mis. "aplikasi pencatat keuangan", "pengelola keuangan online", "aplikasi keuangan pribadi gratis").

> **Ekspektasi yang jujur (penting):** kode hanya membangun **fondasi teknis SEO** yang benar. Peringkat #1 untuk kata kunci kompetitif **tidak bisa dijamin hanya dari kode** — itu butuh konten berkualitas, waktu, dan backlink yang dibangun bertahap. Karena itu, PRD ini mewajibkan struktur konten (blog/artikel) yang siap diisi, bukan sekadar meta tag.

**Wajib dikerjakan:**
1. **Metadata per halaman publik** via Next.js Metadata API: `title`, `description` (mengandung kata kunci secara natural), `canonical`, Open Graph, dan Twitter Card. Set `metadataBase` dari `NEXT_PUBLIC_SITE_URL`. Bahasa `lang="id"` / locale `id-ID`.
2. **`app/robots.ts`** → hasilkan `robots.txt`: area publik `Allow`, area privat/`/api` `Disallow`; cantumkan URL sitemap.
3. **`app/sitemap.ts`** → `sitemap.xml` dinamis berisi semua halaman publik + artikel blog.
4. **`noindex, nofollow`** untuk seluruh area privat (dashboard) & endpoint API.
5. **JSON-LD structured data:** `WebApplication`/`SoftwareApplication` + `Organization` di landing; `FAQPage` di halaman FAQ; `BreadcrumbList`; `Article` di halaman blog.
6. **Semantic HTML & konten:** satu `<h1>` per halaman, hierarki heading rapi, `alt` pada gambar, internal linking. Landing page berisi hero (dengan kata kunci), penjelasan fitur, manfaat, screenshot produk, dan CTA daftar.
7. **Struktur blog/artikel** (list + detail) untuk menargetkan long-tail keyword (mis. "cara mengelola keuangan pribadi", "aplikasi pencatat pengeluaran gratis"). Boleh diisi 2–3 artikel contoh; sisanya siap ditambah.
8. **Core Web Vitals:** halaman publik SSR/SSG/ISR (bukan client-only, agar crawler membaca konten), optimasi gambar `next/image`, font dioptimalkan, lazy-load. Target skor Lighthouse SEO & Performance tinggi.

---

## 11. PWA — Bisa Di-install seperti Aplikasi

**Didukung Hostinger.** PWA hanya butuh HTTPS + file manifest & service worker; Hostinger menyediakan SSL gratis, jadi fitur ini **masuk scope** (bukan di-skip). Tujuan: user bisa klik ikon aplikasi di home screen tanpa buka browser manual.

**Wajib dikerjakan:**
1. **`manifest.webmanifest`:** `name`, `short_name`, `description`, `start_url`, `display: "standalone"`, `theme_color`, `background_color`, `orientation`, dan ikon lengkap (192px, 512px, dan versi `maskable`). Sertakan `apple-touch-icon` + meta terkait iOS.
2. **Service worker** via **Serwist (`@serwist/next`)** atau `next-pwa` (pilih yang kompatibel dengan versi Next.js). Strategi cache: **cache-first** untuk aset statis (app shell), **network-first** untuk data. **Jangan** cache response API privat yang sensitif.
3. **Offline fallback ringan:** halaman offline sederhana untuk app shell. **Bukan** full offline finance (data tetap butuh server) — jangan janjikan mode offline penuh.
4. **Install prompt kustom** (tombol "Install App") — opsional tapi disarankan.
5. Service worker **hanya aktif di production build**; hati-hati dengan versioning/`skipWaiting` agar update deploy tidak "nyangkut" di cache lama.

---

## 12. Arahan Desain UI/UX (anti "template AI")

**Wajib.** Gunakan skill **"ui/ux pro max"** yang sudah terpasang di Claude Code sebagai panduan utama untuk merancang tampilan. Terapkan arahan desain ini **sejak awal di setiap halaman**, bukan hanya di tahap polish akhir.

**Responsif di semua perangkat = acceptance criteria (tidak bisa ditawar):** mobile, tablet, dan desktop harus rapi dan nyaman dipakai.

**Hindari kesan generik / "AI banget":**
- Jangan pakai klise: gradient ungu-biru default, layout hero + 3 kartu fitur seragam, emoji sebagai ikon, atau warna default Tailwind apa adanya.
- **Punya identitas visual:** tentukan palet brand khusus yang konsisten (light & dark mode) dengan warna aksen yang khas. Simpan sebagai **design tokens** (CSS variables + Tailwind config) di satu tempat.
- **Tipografi berkarakter:** pilih pasangan font yang disengaja (display untuk heading + font teks yang enak dibaca), skala tipografi konsisten.
- **Layout disengaja:** spacing/grid rapi, whitespace cukup, alignment konsisten, radius & shadow konsisten.
- **Micro-interactions halus:** hover, transisi, skeleton loading, empty state yang informatif, dan feedback saat aksi (toast) — secukupnya, tidak berlebihan.
- **Data viz rapi:** grafik keuangan dengan warna konsisten & terbaca, format angka/currency benar.
- **Aksesibilitas:** kontras WCAG AA, focus state jelas, target sentuh cukup besar, navigasi keyboard.
- Gunakan **shadcn/ui sebagai basis lalu kustomisasi temanya** supaya tidak terlihat seperti default.

---

## 13. Environment Variables

Buat `.env.example`:
```
# Database (isi dari hPanel Hostinger)
DB_HOST=localhost
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=

# Auth
JWT_SECRET=            # string acak panjang
NODE_ENV=production

# Recurring runner
CRON_SECRET=           # rahasia untuk memicu /api/recurring/run

# SEO — URL domain produksi (untuk canonical, sitemap, Open Graph)
NEXT_PUBLIC_SITE_URL=https://domainkamu.com

# FX / kurs mata uang — API GRATIS TANPA KEY (tidak wajib diisi)
# Primary: https://api.frankfurter.dev | Fallback: fawazahmed0 exchange-api (jsDelivr CDN)
FX_PRIMARY_URL=https://api.frankfurter.dev
```

---

## 14. Deployment ke Hostinger (tulis di README)

1. Push repo ke GitHub.
2. Di hPanel: buat **MySQL database** + user, catat kredensialnya.
3. Buka **phpMyAdmin** → pilih database → tab **Import** → unggah `db/schema.sql` (lalu `db/seed.sql` bila ada).
4. Di hPanel **Node.js / Web Apps Hosting**: hubungkan repo GitHub (auto-build) atau upload ZIP.
5. Set **environment variables** sesuai `.env.example` (DB_HOST biasanya `localhost`, port `3306`).
6. Build command: `npm run build`; start command: `npm start` (`next start`). Pastikan **bukan** static export.
7. Untuk recurring: buat cron/uptime yang memanggil `POST /api/recurring/run` dengan header `x-cron-secret` sekali sehari (jelaskan opsi ini di README; kalau cron tak tersedia, sediakan tombol "jalankan sekarang" di Settings).

---

## 15. Standar Kualitas & Acceptance Criteria

- **TypeScript strict**, tidak ada `any` yang tidak perlu. Lolos `next build` tanpa error.
- **Validasi Zod** di semua endpoint; error response konsisten (`{ error: { message, code } }`).
- **Uang akurat**: uji kasus konversi mata uang & transfer beda mata uang (tidak ada floating point error).
- **Isolasi data**: user A tidak bisa mengakses data user B (uji dengan mengganti `:id`).
- **Saldo benar** setelah income/expense/transfer/hapus transaksi.
- **README** lengkap: setup lokal, cara import SQL, cara deploy Hostinger, daftar env.
- Sertakan **beberapa test** untuk logika kritikal (perhitungan saldo, konversi currency, status utang, penjadwalan recurring).
- Seed/demo opsional untuk memudahkan review.

**Definition of Done:** aplikasi bisa dijalankan lokal (`npm run dev`), semua modul berfungsi end-to-end, `db/schema.sql` bisa di-import bersih ke MySQL kosong, dan aplikasi siap deploy ke Hostinger sesuai bagian 11.

---

## 16. Out of Scope (v1)

- Reset password via email (SMTP) — siapkan strukturnya saja.
- Import mutasi rekening / CSV.
- Aplikasi mobile native. (PWA installable **termasuk scope** — lihat Bagian 11; namun **full offline mode** di luar scope, cukup app shell + halaman offline.)
- Multi-user kolaboratif dalam satu akun (sharing antar user).
- Kurs historis otomatis penuh (v1: kurs disimpan per transaksi + kurs manual).

---

## 17. Urutan Pengerjaan yang Disarankan

1. Setup proyek (Next.js + Tailwind + shadcn + Kysely + koneksi DB) & `db/schema.sql`.
2. Auth (register/login/logout/me) + middleware proteksi.
3. Wallets + Categories + Currencies + kurs manual.
4. Transactions + perhitungan saldo + Transfers.
5. Dashboard & Reports (grafik).
6. Budgets + Goals.
7. Debts + payments.
8. Recurring + endpoint runner.
9. Halaman publik + SEO: landing, metadata, `robots.ts`, `sitemap.ts`, JSON-LD, struktur blog (Bagian 10).
10. PWA: manifest, ikon, service worker, offline fallback (Bagian 11).
11. Settings, terapkan Arahan Desain (Bagian 12) + cek responsif semua perangkat, test, README, cek Lighthouse.

> **Arahan Desain (Bagian 12) & responsivitas diterapkan sejak awal di setiap halaman**, bukan hanya di tahap akhir.
> Setelah selesai tiap tahap, pastikan `next build` lolos dan modul teruji sebelum lanjut.
