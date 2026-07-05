# Prompt Eksekusi untuk Claude Code

> **Cara pakai:** Taruh file ini dan `PRD-Aplikasi-Keuangan.md` di root repo/folder proyek. Buka Claude Code di folder itu, lalu paste seluruh isi di bawah ini sebagai instruksi pertama.

---

Kamu adalah senior full-stack engineer yang bertugas membangun aplikasi ini **secara mandiri, dari nol sampai selesai**, mengikuti dokumen `PRD-Aplikasi-Keuangan.md` di root proyek ini sebagai spesifikasi resmi.

**Mode kerja: eksekusi langsung.** Jangan berhenti untuk bertanya kecuali benar-benar buntu (lihat aturan "Kapan Boleh Bertanya" di bawah). Ambil keputusan teknis kecil sendiri berdasarkan PRD, best practice, dan konteks yang ada, lalu catat keputusan itu di log progres. Tujuannya kamu bisa jalan panjang tanpa menunggu konfirmasi user di setiap langkah.

---

## 0. WAJIB DIBACA DULU SEBELUM MENULIS KODE APA PUN

1. Baca **seluruh** `PRD-Aplikasi-Keuangan.md` dari awal sampai akhir. Jangan mulai coding sebelum paham semua bagian, terutama **Bagian 2 (Non-Negotiable Constraints)**, **Bagian 5 (Skema DB)**, dan **Bagian 12 (Arahan Desain)**.
2. Cek apakah file **`PROGRESS.md`** sudah ada di root proyek.
   - **Kalau sudah ada** → ini adalah lanjutan sesi sebelumnya. Baca seluruh isinya, terutama bagian "STATUS SAAT INI" di paling atas, lalu **lanjutkan persis dari titik terakhir**. Jangan mengulang kerjaan yang sudah ditandai selesai. Jangan menimpa/menghapus riwayat lama di file ini — hanya tambah entri baru (append).
   - **Kalau belum ada** → buat file `PROGRESS.md` sekarang, sebelum menyentuh kode, dengan struktur di Bagian 1 di bawah.
3. Kalau ada skill/plugin desain yang sudah terpasang di Claude Code kamu (mis. yang disebut di PRD Bagian 12), aktifkan/gunakan itu untuk semua keputusan visual.

---

## 1. Sistem Progress Log (`PROGRESS.md`) — WAJIB, ini kritikal

Alasan: pekerjaan ini besar dan bisa kena limit token/context di tengah jalan. `PROGRESS.md` adalah **satu-satunya sumber kebenaran** tentang apa yang sudah dan belum dikerjakan, supaya sesi berikutnya (baik kamu lanjut, atau instance Claude Code yang baru) bisa langsung melanjutkan **tanpa menebak-nebak dan tanpa menimpa pekerjaan yang sudah ada**.

### Struktur wajib file `PROGRESS.md`

```markdown
# Progress Log — Aplikasi Pengelola Keuangan

## STATUS SAAT INI
(Selalu update bagian ini paling akhir setiap kali selesai satu unit kerja. Ini yang PERTAMA dibaca saat resume.)
- Tahap aktif: <nama tahap sesuai Bagian 17 PRD>
- Sedang mengerjakan: <deskripsi spesifik, mis. "membuat route POST /api/transactions">
- Langkah berikutnya: <langkah paling konkret setelah ini>
- Blocker (jika ada): <apa yang menghambat, atau "tidak ada">

## CHECKLIST TAHAPAN (sesuai Bagian 17 PRD)
- [ ] 1. Setup proyek (Next.js + Tailwind + shadcn + Kysely + koneksi DB) & db/schema.sql
- [ ] 2. Auth (register/login/logout/me) + middleware proteksi
- [ ] 3. Wallets + Categories + Currencies + kurs manual
- [ ] 4. Transactions + perhitungan saldo + Transfers
- [ ] 5. Dashboard & Reports (grafik)
- [ ] 6. Budgets + Goals
- [ ] 7. Debts + payments
- [ ] 8. Recurring + endpoint runner
- [ ] 9. Halaman publik + SEO (landing, metadata, robots, sitemap, JSON-LD, blog)
- [ ] 10. PWA (manifest, service worker, offline fallback)
- [ ] 11. Settings, terapkan Arahan Desain, cek responsif, test, README, Lighthouse

(Pecah lagi tiap tahap jadi sub-checklist saat mulai mengerjakannya — mis. tahap 4 dipecah jadi: [ ] endpoint POST transaksi, [ ] endpoint GET list+filter, [ ] logika hitung saldo, [ ] endpoint transfer, [ ] test saldo. Centang [x] setiap sub-item selesai.)

## KEPUTUSAN & PENYIMPANGAN DARI PRD
(Catat setiap kali kamu mengambil keputusan teknis yang tidak eksplisit diatur PRD, atau terpaksa menyimpang dari PRD. Format: tanggal/waktu sesi — apa — kenapa.)
- <contoh> Sesi 1 — Memilih Serwist (bukan next-pwa) untuk PWA karena lebih kompatibel dengan Next.js versi terbaru saat ini.

## MASALAH DIKETAHUI / TODO LANJUTAN
(Bug kecil, technical debt, atau hal yang sengaja ditunda. Hapus baris dari sini kalau sudah beres.)

## LOG SESI
(Tambah entri baru di PALING BAWAH setiap sesi kerja — jangan pernah edit/hapus entri lama.)

### Sesi 1 — <tanggal/waktu>
- File dibuat: ...
- File diubah: ...
- Fitur/endpoint yang selesai & sudah diuji: ...
- Catatan: ...
```

### Aturan pemakaian `PROGRESS.md`

- **Update setelah setiap unit kerja kecil selesai** (satu endpoint, satu tabel migrasi, satu halaman, satu modul) — **jangan tunggu sampai akhir sesi**. Kalau sesi terputus tiba-tiba karena limit token, progres yang sudah dicentang tidak boleh hilang.
- **Append, jangan overwrite.** Bagian "LOG SESI" dan "KEPUTUSAN & PENYIMPANGAN" hanya boleh ditambah, tidak boleh ditimpa/dihapus. Bagian "STATUS SAAT INI" dan "CHECKLIST" boleh diperbarui statusnya (centang/ubah teks) tapi jangan hapus riwayat checklist yang sudah selesai.
- **"STATUS SAAT INI" harus selalu presisi** — cukup detail sehingga instance Claude Code yang benar-benar baru (tanpa ingatan sesi ini sama sekali) bisa langsung tahu harus mulai dari file/baris/perintah apa.
- Sebelum menandai satu tahap besar selesai, pastikan `next build` lolos dan (kalau relevan) test terkait lolos — baru dicentang.
- File ini **bukan untuk user**, tapi untuk kelangsungan kerja lintas sesi. Tetap tulis ringkas dan jelas, bukan bertele-tele.

---

## 2. Urutan Eksekusi

Ikuti urutan di **PRD Bagian 17** secara berurutan, satu tahap tuntas (termasuk lolos build) sebelum lanjut ke tahap berikutnya. Untuk tiap tahap:

1. Cek `PROGRESS.md` — apakah tahap ini sudah dimulai/sebagian selesai?
2. Pecah tahap jadi sub-langkah konkret di checklist kalau belum dipecah.
3. Kerjakan sub-langkah satu per satu, commit progres ke `PROGRESS.md` setiap kali satu sub-langkah selesai.
4. Setelah tahap selesai: jalankan `next build` (dan test jika ada), perbaiki error, baru centang tahap sebagai selesai.
5. Lanjut ke tahap berikutnya.

---

## 3. Standar Kerja

- Ikuti **semua** Non-Negotiable Constraints di PRD Bagian 2 tanpa kecuali (MySQL saja, tanpa Prisma, Kysely, schema.sql tunggal untuk import phpMyAdmin, satu app Next.js, uang selalu `DECIMAL`, otorisasi ketat per `user_id`).
- Tulis kode production-ready: TypeScript strict, validasi Zod di semua endpoint, penanganan error konsisten.
- Untuk desain (PRD Bagian 12): terapkan sejak halaman pertama dibuat, bukan ditunda ke akhir. Selalu cek tampilan responsif mobile/tablet/desktop untuk setiap halaman yang selesai dibuat.
- Untuk SEO & PWA (PRD Bagian 10–11): kerjakan di tahap yang sudah ditentukan di urutan eksekusi, jangan diabaikan.
- Setelah setiap modul/tahap selesai, lakukan pengecekan singkat terhadap **Acceptance Criteria** di PRD Bagian 15 yang relevan dengan modul tersebut.
- Perbarui `README.md` secara bertahap (bukan hanya di akhir) — terutama setiap kali ada keputusan setup/env baru.

---

## 4. Kapan Boleh Bertanya ke User

Lanjutkan bekerja secara mandiri di hampir semua situasi. **Hanya berhenti dan bertanya ke user** jika:
- PRD benar-benar ambigu/kontradiktif pada keputusan yang **berdampak besar dan sulit diubah nanti** (mis. mengubah struktur skema database inti setelah data ada).
- Butuh kredensial/akses yang hanya dimiliki user (mis. domain asli untuk `NEXT_PUBLIC_SITE_URL`, kredensial DB Hostinger asli untuk deploy nyata).
- Menemukan bahwa satu constraint PRD **tidak mungkin dipenuhi secara teknis** (mis. library yang diminta ternyata sudah deprecated) — jelaskan masalahnya + usulkan alternatif, baru lanjut setelah dikonfirmasi (atau catat asumsi di `PROGRESS.md` dan lanjut jalan kalau user tidak merespons cepat, supaya tidak macet).

Untuk semua keputusan kecil lainnya (nama variabel, struktur folder detail, pilihan library pendukung ringan, dsb.) — **putuskan sendiri**, catat di `PROGRESS.md`, dan terus jalan.

---

## 5. Mulai Sekarang

1. Baca `PRD-Aplikasi-Keuangan.md` penuh.
2. Cek/buat `PROGRESS.md` sesuai Bagian 1 di atas.
3. Mulai dari tahap pertama yang belum selesai menurut checklist.
4. Kerjakan sampai tahap tersebut tuntas, update `PROGRESS.md`, lalu lanjut ke tahap berikutnya tanpa menunggu instruksi tambahan.
