# Progress Log — Aplikasi Pengelola Keuangan

## STATUS SAAT INI
- Tahap aktif: SEMUA 11 TAHAP PRD SELESAI ✅
- Sedang mengerjakan: —
- Langkah berikutnya (opsional/polish lanjutan): uji visual dark mode per halaman, uji install prompt PWA di HP nyata, ganti email kontak placeholder + NEXT_PUBLIC_SITE_URL saat domain produksi ada, screenshot produk asli utk landing, push ke GitHub + deploy Hostinger sesuai README
- Blocker (jika ada): tidak ada
- Blocker (jika ada): tidak ada

## CHECKLIST TAHAPAN (sesuai Bagian 17 PRD)
- [x] 1. Setup proyek (Next.js + Tailwind + shadcn + Kysely + koneksi DB) & db/schema.sql
- [x] 2. Auth (register/login/logout/me) + middleware proteksi
- [x] 3. Wallets + Categories + Currencies + kurs manual
- [x] 4. Transactions + perhitungan saldo + Transfers
- [x] 5. Dashboard & Reports (grafik)
- [x] 6. Budgets + Goals
- [x] 7. Debts + payments
- [x] 8. Recurring + endpoint runner
- [x] 9. Halaman publik + SEO (landing, metadata, robots, sitemap, JSON-LD, blog)
- [x] 10. PWA (manifest, service worker, offline fallback)
- [x] 11. Settings, terapkan Arahan Desain, cek responsif, test, README, Lighthouse

### Sub-checklist Tahap 1 (SELESAI)
- [x] create-next-app (Next.js 16.2.10, App Router, TS, Tailwind v4) di root proyek
- [x] Install deps: kysely, mysql2, zod, bcryptjs, jose, react-hook-form, @hookform/resolvers, date-fns, decimal.js, recharts, lucide-react
- [x] Init shadcn/ui (preset nova, radix, css variables) + 24 komponen dasar
- [x] Design tokens kustom di globals.css (palet emerald/amber, light+dark, sidebar hijau gelap)
- [x] Font: Bricolage Grotesque (display) + Plus Jakarta Sans (body) + Geist Mono, lang="id"
- [x] db/schema.sql (semua tabel sesuai PRD Bagian 5) — teruji import bersih ke MySQL 8 lokal
- [x] db/seed.sql (20 currencies) — teruji import
- [x] src/db/client.ts (pool mysql2 decimalNumbers:false + Kysely, singleton global utk dev)
- [x] src/db/schema-types.ts (tipe manual 12 tabel; DECIMAL = string)
- [x] .env.example + .env lokal (Laragon MySQL root tanpa password, db `elbimas`)
- [x] next build lolos

### Sub-checklist Tahap 2 (SELESAI)
- [x] src/lib/api.ts — ApiError + jsonError `{ error: { message, code } }` + parseJsonBody + handleApiError
- [x] src/lib/auth.ts — bcryptjs cost 10, JWT jose HS256 7 hari, cookie httpOnly `elbimas_session`, getCurrentUser() (React cache), requireUser()
- [x] src/lib/rate-limit.ts — in-memory per IP (register 5/15mnt, login 10/15mnt)
- [x] src/lib/validators/auth.ts — Zod register/login
- [x] src/server/auth-service.ts — register (validasi currency + 15 kategori default dlm transaksi DB), login
- [x] POST /api/auth/register, /login, /logout, GET /api/auth/me
- [x] src/proxy.ts (konvensi baru Next 16 pengganti middleware.ts) — proteksi 9 prefix privat, redirect login↔dashboard, security headers, X-Robots-Tag noindex utk area privat & /api
- [x] Halaman /login & /register — layout split brand panel hijau (auth), react-hook-form + zod, select base currency dari DB, show/hide password
- [x] Uji end-to-end via curl: register 201 + cookie, me 200/401, logout, login salah 401, duplikat email 409, /dashboard tanpa cookie → 307 /login?next=. Kategori default terverifikasi (15 baris). next build lolos.

### Sub-checklist Tahap 3 (SELESAI)
- [x] src/lib/money.ts (decimal.js: dec/toDbMoney/toDbRate/sumMoney/toBase/formatMoney id-ID; IDR/JPY/KRW/VND 0 desimal)
- [x] Validators: common (moneyString/dateString/monthString/currencyCode/idParam), wallet (+transfer), category, rate
- [x] wallet-service: list/get/create/update/delete + saldo on-the-fly (initial + Σtx ± Σtransfer, agregasi SQL + Decimal); delete diblok 409 kalau masih dipakai (WALLET_IN_USE)
- [x] category-service: list/create/update/delete (cek parent type, cegah self-parent)
- [x] rate-service: listRates (terbaru per pasangan), upsertRate (onDuplicateKeyUpdate), findConversionRate (direct+inverse), syncRates (Frankfurter → fallback fawazahmed0 jsDelivr, cache per hari via cek DB)
- [x] Routes: /api/wallets(+/:id,+/:id/balance), /api/categories(+/:id), /api/currencies (tanpa auth—data global), /api/rates, /api/rates/sync
- [x] Shell dashboard: (dashboard)/layout.tsx — sidebar desktop hijau gelap, header sticky, MobileMenu (Sheet), MobileBottomNav (4 item), UserMenu (logout), ThemeToggle (next-themes, Providers di root)
- [x] Halaman /wallets: grid kartu (aksen warna, saldo tabular-nums, badge arsip), dialog tambah/ubah (currency terkunci saat edit), arsip/aktifkan, hapus dgn AlertDialog, empty state
- [x] /dashboard placeholder (diisi Tahap 5)
- [x] Uji curl: CRUD wallet ok, saldo ok, invalid currency 422, kategori ok, rate manual ok, sync ok (18 synced: Frankfurter 15 + fallback AED/SAR/VND, USD skipped cached), tanpa cookie 401. next build lolos.

### Sub-checklist Tahap 4 (SELESAI)
- [x] validators/transaction.ts (create/update/listQuery dgn filter & pagination)
- [x] transaction-service: create (fx_rate_to_base otomatis dari findConversionRate → fallback 1; currency dari wallet), list (join wallet+kategori, filter date/wallet/category/type/search note, pagination + total), get/update (ganti wallet → currency & fx dihitung ulang; ganti tipe → kategori di-null-kan), delete
- [x] transfer-service: list (join nama wallet), create (cek kedua wallet milik user, insert dlm db.transaction), delete
- [x] Routes: /api/transactions (+/:id), /api/transfers (+/:id DELETE)
- [x] Halaman /transactions: filter bar (search, tipe, dompet, kategori, rentang tanggal, bersihkan), list dikelompokkan per tanggal (date-fns locale id), pagination, dialog catat/ubah (toggle tipe, kategori terfilter, hint konversi), hapus dgn konfirmasi, empty state
- [x] TransferDialog di /wallets (dukung beda mata uang: field jumlah diterima manual + fee; tombol muncul jika ≥2 dompet aktif)
- [x] Uji curl: saldo presisi (wallet1: 1.084.500 setelah income 1jt, expense 250rb, transfer keluar 163rb+fee 2.5rb; wallet2: 160.5 USD), fx auto 16260.16 dari kurs manual inverse, mismatch tipe kategori 422, isolasi user B→404 semua, saldo pulih setelah delete. next build lolos.

### Sub-checklist Tahap 5 (SELESAI)
- [x] report-service.getMonthlySummary: totals income/expense/net (SUM amount×fx_rate_to_base), cashflow harian, breakdown per kategori (income+expense), saldo semua wallet + konversi base (findConversionRate; currency tanpa kurs masuk unconverted_currencies), total_balance_base
- [x] GET /api/reports/summary?month=YYYY-MM (default bulan berjalan)
- [x] Komponen: CashflowChart (AreaChart income/expense, gradient token chart-1/chart-4, tooltip id-ID), CategoryDonut (top 5 + "Lainnya", legend+persen), MonthPicker (?month=)
- [x] /dashboard: greeting, 4 kartu statistik (Total Saldo base/Pemasukan/Pengeluaran/Selisih ±), warning kurs belum diatur, grafik 2/3+1/3, daftar dompet + transaksi terbaru (5)
- [x] Verifikasi angka: income 1.813.008,13 (1jt + 50USD×16260,16), total saldo base 3.694.256,10 — cocok hitung manual. next build lolos.
- Catatan: labelFormatter Recharts bertipe ReactNode → perlu guard typeof string.

### Sub-checklist Tahap 6 (SELESAI)
- [x] budget-service: listBudgetsWithActuals (realisasi per kategori + total dari SUM expense×fx), createBudget (hanya kategori expense; duplikat NULL dicek manual krn unique key MySQL loloskan NULL), update amount, delete
- [x] goal-service: list/get/create/update/delete + contributeToGoal (transaksi DB, is_achieved otomatis, blok kontribusi setelah tercapai)
- [x] Routes: /api/budgets (+/:id), /api/goals (+/:id, +/:id/contribute)
- [x] /budgets: MonthPicker, kartu progress bar (indikator over merah + badge), dialog tambah (kategori tersedia terfilter + opsi total), ubah nominal, hapus
- [x] /goals: kartu progres %, badge tercapai, dialog tambah/ubah (currency, dompet penampung, tanggal target), dialog kontribusi, hapus
- [x] Uji curl: realisasi 250rb/300rb=83%, budget total 13%, duplikat 409, kategori income 422, goal 60%→100% is_achieved=1, kontribusi lanjut 422. Halaman 200. next build lolos.

### Sub-checklist Tahap 7 (SELESAI)
- [x] validators/debt.ts (create/update/payment; positiveMoney, currency default base user)
- [x] debt-service: listDebts (SUM payments via LEFT JOIN+GROUP BY, sort: belum lunas dulu → due_date terdekat), getDebt (+payments join wallet), createDebt, updateDebt (ubah principal → status dihitung ulang), deleteDebt (payments ikut via FK CASCADE), addDebtPayment (transaksi DB, blok kalau settled 422 DEBT_SETTLED, validasi wallet milik user, status otomatis open/partial/settled)
- [x] Routes: /api/debts (GET ?type= + POST), /api/debts/[id] (GET/PATCH/DELETE), /api/debts/[id]/payments (POST)
- [x] Halaman /debts: tab Utang Saya/Piutang, kartu progress + badge status + jatuh tempo, dialog tambah/ubah (toggle jenis, currency terkunci saat edit), dialog catat pembayaran (prefill sisa, dompet opsional), dialog riwayat pembayaran (fetch on-open), hapus dgn AlertDialog, empty state
- [x] Uji curl end-to-end: create payable/receivable 201, payment 200rb → partial 40%, +300rb → settled 100%, bayar setelah lunas 422, wallet invalid 404, nominal negatif 422, PATCH principal naik → settled balik ke partial 83%, isolasi user B 404 (GET & DELETE), delete cascade (0 orphan di debt_payments), payment dgn wallet valid → wallet_name muncul di riwayat, /debts 200, tanpa cookie 401, filter ?type=payable ok. next build lolos.

### Sub-checklist Tahap 8 (SELESAI)
- [x] validators/recurring.ts (create/update; frequency enum, interval_count 1-365, is_active boolean)
- [x] recurring-service: advanceRunDate (fungsi murni, date-fns — 31 Jan + 1 bln = 28/29 Feb, di-export utk unit test Tahap 11), list/get/create/update/delete (currency dari wallet, validasi kategori-tipe, END_BEFORE_START 422), runDueRecurrings (catch-up multi-periode terlewat: insert batch transaksi bertanggal jadwal aslinya, fx dari findConversionRate per user, per-recurring dlm db.transaction, nonaktif otomatis lewat end_date; idempotent krn next_run_date maju melewati today)
- [x] Routes: /api/recurring (GET/POST), /api/recurring/[id] (GET/PATCH/DELETE), POST /api/recurring/run (x-cron-secret → semua user; session login → user itu saja; selain itu 401)
- [x] Halaman /recurring: kartu per jadwal (ikon tipe, frekuensi "Tiap N bulan", jadwal berikutnya, badge berakhir), Switch toggle aktif/jeda, tombol "Jalankan Sekarang" (+titik warning kalau ada yg due), dialog tambah/ubah (toggle tipe, kategori terfilter, frekuensi+interval, tanggal mulai/berakhir), hapus dgn AlertDialog, empty state
- [x] Uji curl end-to-end: create 201, catch-up 3 tx dari 3 periode terlewat (2026-05-03/06-03/07-03) → next 2026-08-03, run ke-2 idempotent (0 tx), clamp akhir bulan (31 Jan → 28 Feb) terverifikasi, end_date → deactivated=1 & is_active=false, cron secret benar 200 / salah 401 / tanpa auth 401, PATCH toggle + next_run_date ok, END_BEFORE_START 422, kategori mismatch 422, isolasi user B 404, /recurring 200, delete 200 → 404. next build lolos.

### Sub-checklist Tahap 9 (SELESAI)
- [x] src/lib/site.ts (SITE_NAME/URL/DESCRIPTION/KEYWORDS + PUBLIC_NAV), src/lib/blog.ts (3 artikel long-tail: cara mengelola keuangan pribadi, aplikasi pencatat pengeluaran gratis, metode 50/30/20)
- [x] Komponen publik: SiteHeader (nav aktif, Sheet mobile, CTA Daftar), SiteFooter (bg sidebar hijau gelap, 3 kolom), JsonLd helper
- [x] Route group (public): layout (skip-link + header + footer), landing (hero + mockup dashboard CSS + 6 kartu fitur + 3 langkah + CTA; JSON-LD WebApplication+Organization), /fitur (4 grup × 3 fitur), /tentang, /faq (8 Q&A + JSON-LD FAQPage), /kontak, /blog (list) + /blog/[slug] (SSG via generateStaticParams; JSON-LD Article + BreadcrumbList)
- [x] app/robots.ts (allow publik, disallow api+privat+auth, sitemap URL), app/sitemap.ts (6 halaman statis + 3 artikel)
- [x] Metadata per halaman: title, description berisi keyword, canonical, OG (locale id_ID), Twitter card, robots index/follow eksplisit
- [x] Verifikasi curl: semua halaman publik 200 & prerender statis (○/●), slug tak dikenal 404, robots.txt & sitemap.xml benar, h1 + canonical + og:title ada, JSON-LD (WebApplication/Organization/FAQPage/Article/BreadcrumbList) muncul di HTML SSR, X-Robots-Tag noindex utk /api & dashboard (dgn cookie), landing TANPA noindex. next build lolos (perlu hapus .next dulu — stale dev types msh merujuk src/app/page.tsx lama).

### Sub-checklist Tahap 10 (SELESAI)
- [x] scripts/generate-icons.mjs (sharp — sudah ada via Next): ikon dompet emerald 192/512 + maskable (safe zone) + apple-touch-icon 180 → public/icons/
- [x] src/app/manifest.ts (MetadataRoute.Manifest): name/short_name/description, id "/", start_url /dashboard, standalone, portrait, theme #0f8a6d, lang id, 4 ikon
- [x] public/sw.js manual: cache-first aset statis (_next/static, icons, font/gambar), network-first navigasi dgn fallback /offline; /api/* TIDAK PERNAH di-cache; halaman privat TIDAK di-cache (hanya fallback offline); versioned cache + skipWaiting + clients.claim + bersihkan cache lama saat activate
- [x] /offline page (noindex), SwRegister (client, hanya NODE_ENV production), root layout: appleWebApp meta + apple-touch-icon + viewport themeColor light/dark
- [x] Verifikasi curl: manifest.webmanifest 200 (isi benar), sw.js/offline/5 ikon 200, link manifest + apple-touch-icon + theme-color muncul di HTML. next build lolos. (Registrasi SW butuh browser — dicek visual di Tahap 11.)

## KEPUTUSAN & PENYIMPANGAN DARI PRD
- Sesi 1 — Next.js 16.2.10 (terbaru saat scaffold) + Tailwind v4 + shadcn CLI baru (preset "nova", primitives radix). PRD tidak mengunci versi.
- Sesi 1 — Folder root bernama `Elbimas` (kapital) ditolak npm sebagai nama package → package.json diberi nama `elbimas`, scaffold dilakukan via folder temp lalu dipindah.
- Sesi 1 — JWT pakai `jose` (bukan jsonwebtoken) karena kompatibel Edge runtime untuk middleware Next.js.
- Sesi 1 — bcryptjs (pure JS) dipilih daripada bcrypt native supaya build di Hostinger tidak butuh kompilasi native.
- Sesi 1 — Desain (skill ui-ux-pro-max): palet brand emerald/teal (primary oklch(0.51 0.1 168)) + aksen amber; menghindari ungu-biru generik. Font display Bricolage Grotesque + body Plus Jakarta Sans (font karya desainer Indonesia — cocok identitas produk). Sidebar hijau gelap di light & dark mode sebagai ciri khas. Token tambahan: --success, --warning.
- Sesi 1 — mysql2 `decimalNumbers: false` → semua DECIMAL dibaca string; perhitungan uang pakai decimal.js.
- Sesi 1 — Komponen shadcn `form` tidak tersedia di registry baru → wiring form pakai react-hook-form langsung.
- Sesi 2 — Tombol "Jalankan Sekarang" recurring ditaruh di halaman /recurring (PRD menyarankan di Settings; lebih dekat konteksnya di sini — bisa ditambah juga di Settings saat Tahap 11 kalau perlu).
- Sesi 2 — POST /api/recurring/run menerima dua mode: header x-cron-secret (proses semua user, utk cron Hostinger) ATAU session login biasa (proses milik user itu saja, utk tombol manual). PRD hanya menyebut mode secret.
- Sesi 2 — Transaksi hasil runner diberi tanggal jadwal aslinya (bukan tanggal eksekusi) supaya laporan bulanan akurat saat catch-up periode terlewat.
- Sesi 2 — Landing "screenshot produk" dibuat sebagai mockup dashboard CSS murni (div + token warna brand), bukan file gambar — tidak ada aset screenshot nyata & menghindari gambar rusak; bisa diganti screenshot asli nanti.
- Sesi 2 — /login & /register ikut di-disallow di robots.txt (halaman auth tak perlu diindeks; landing adalah pintu masuk SEO).
- Sesi 2 — Email kontak halo@/security@elbimas.app adalah placeholder — ganti saat domain produksi ada.
- Sesi 2 — PWA pakai service worker MANUAL (public/sw.js), bukan @serwist/next: build Next 16 memakai Turbopack sedangkan serwist/next-pwa adalah plugin webpack (tidak kompatibel). SW manual sederhana & memenuhi semua syarat PRD Bagian 11.

## MASALAH DIKETAHUI / TODO LANJUTAN
- MySQL lokal dinyalakan manual (`mysqld --datadir=C:\laragon\data\mysql-8`, tidak via GUI Laragon). Kalau koneksi gagal di sesi berikutnya, nyalakan lagi dengan perintah itu.
- ~~PWA (tahap 10): rencana pakai @serwist/next~~ SELESAI di Sesi 2 dgn SW manual (Turbopack tidak kompatibel plugin webpack serwist).
- ~~Registrasi service worker belum dicek di browser~~ SELESAI: SW aktif, diverifikasi via Playwright headless. Install prompt di HP nyata belum diuji (butuh perangkat + HTTPS).
- Angka statistik di kartu dashboard mobile ter-truncate ("Rp 60…") di layar 375px — kosmetik, bisa diperkecil font/format kompak nanti.
- devDeps tambahan Sesi 2: vitest (unit test) + playwright (verifikasi visual; chromium ~460MB di %LOCALAPPDATA%\ms-playwright — tidak masuk repo).
- Password user test tester1@elbimas.test (sesi 1) tidak tercatat — user test aktif sekarang: tester-debts@elbimas.test / RahasiaKuat123 (id=3).

## LOG SESI

### Sesi 1 — 2026-07-05
- PRD dibaca penuh. PROGRESS.md dibuat.
- Scaffold Next.js 16.2.10 + install semua deps + shadcn init (24 komponen ui/).
- File dibuat: db/schema.sql, db/seed.sql, src/db/client.ts, src/db/schema-types.ts, .env.example, .env
- File diubah: src/app/globals.css (design tokens Elbimas), src/app/layout.tsx (font, lang id, Toaster, metadata dasar), package.json (nama)
- Database `elbimas` dibuat di MySQL 8 lokal; schema.sql + seed.sql teruji import bersih (12 tabel, 20 currencies).
- `next build` lolos. Tahap 1 SELESAI.
- Tahap 2 (Auth) dikerjakan & SELESAI di sesi yang sama: lib (api/auth/rate-limit/validators), auth-service, 4 endpoint auth, src/proxy.ts, halaman login+register dengan layout brand. Teruji end-to-end via curl + verifikasi DB. User test: tester1@elbimas.test (id=1).
- Tahap 3 SELESAI: money lib, validators, 3 service, 8 route, shell dashboard (sidebar+mobile nav+user menu+dark mode), halaman /wallets penuh. Data test: wallet id=1 (Dompet Tunai IDR 500rb), id=2 (Bank USD 100.5), kurs IDR→18 currency tersinkron.
- Catatan teknis: kolom DATE difilter pakai sql<Date>`${str}` (Kysely mengetik operand where sebagai Date).

### Sesi 2 — 2026-07-05
- Resume setelah session limit. Verifikasi disk vs PROGRESS.md: log bilang Tahap 7 "baru mulai", tapi SEMUA file debts ternyata sudah ada & lengkap di disk (validators/debt.ts, debt-service.ts, 3 route, debts/page.tsx, debts-view.tsx) — sesi 1 terputus sebelum sempat update log. Tidak ada file terpotong.
- `next build` lolos bersih (semua route debts terdaftar). Nav sidebar & proxy sudah mencakup /debts.
- MySQL dinyalakan manual (path lengkap: C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqld.exe --datadir=C:\laragon\data\mysql-8).
- Uji end-to-end Tahap 7 via curl (17 skenario, semua lolos — detail di sub-checklist). User test baru: tester-debts@elbimas.test (id=3, password tak dicatat sesi 1 utk tester1), tester-debts-b@elbimas.test (id=4, utk uji isolasi).
- Tahap 7 SELESAI. Lanjut Tahap 8 (Recurring).
- Tahap 8 dikerjakan & SELESAI: validators/recurring.ts, recurring-service.ts (advanceRunDate murni + runDueRecurrings idempotent), 3 route (/api/recurring, /[id], /run), halaman /recurring penuh. Uji end-to-end 17 skenario semua lolos (catch-up, clamp akhir bulan, end_date deactivation, dua mode auth runner, isolasi). next build lolos.
- Lanjut Tahap 9 (Halaman publik + SEO).
- Tahap 9 dikerjakan & SELESAI: lib site+blog (3 artikel), SiteHeader/SiteFooter/JsonLd, route group (public) dgn 7 halaman + blog SSG, robots.ts, sitemap.ts, scaffold src/app/page.tsx dihapus. Skill ui-ux-pro-max dipakai utk arahan landing. Verifikasi SEO penuh via curl. next build lolos.
- Lanjut Tahap 10 (PWA).
- Tahap 10 dikerjakan & SELESAI: ikon PWA digenerate via sharp (script scripts/generate-icons.mjs), app/manifest.ts, public/sw.js manual (keputusan: Turbopack tidak kompatibel serwist), /offline, SwRegister di root layout + meta iOS + theme-color. Verifikasi curl lolos, next build lolos.
- Lanjut Tahap 11 (Settings + polish).
- Tahap 11 sebagian besar SELESAI: (a) /settings + PATCH /api/auth/me (validasi UNKNOWN_CURRENCY 422) + SettingsView 4 kartu (Profil/Alat/Kategori/Kurs), teruji curl S1-S6; (b) vitest terpasang (devDep) + vitest.config.ts (alias @) + 3 file test = 23 test lolos (`npm test`); computeStatus di-export dari debt-service utk test; catatan: formatMoney di Node menghasilkan "Rp 1.250.000" (spasi ICU) — test menormalisasi spasi; (c) README ditulis ulang lengkap. next build final lolos (34 halaman).
- SISA Tahap 11 (butuh browser, tidak bisa via curl): registrasi SW + install prompt, cek responsif visual, Lighthouse, review desain per halaman.
- Verifikasi browser DIKERJAKAN via Playwright (devDep + chromium terpasang; script scripts/visual-check.mjs): (a) service worker AKTIF di production build; (b) 0 console error di landing (3 viewport) & seluruh alur login→dashboard→recurring→debts→settings; (c) screenshot 375/768/1366px diperiksa visual — landing, dashboard (desktop+mobile, bottom nav & sidebar benar), recurring, settings semuanya rapi & on-brand.
- Lighthouse (npx lighthouse, preset desktop, Chrome for Testing): awalnya Perf 100 / A11y 96 / BP 100 / SEO 100 — satu-satunya temuan a11y: kontras angka dekoratif "01/02/03" di landing (text-primary/15) → diperbaiki jadi text-primary solid text-4xl. Hasil akhir: Perf 99 / A11y 100 / BP 100 / SEO 100.
- .gitignore ditambah /screenshots + lighthouse-*.json. Tahap 11 SELESAI — SEMUA 11 TAHAP PRD RAMPUNG. Definition of Done terpenuhi: semua modul teruji end-to-end, build bersih, schema.sql importable, siap deploy Hostinger.
