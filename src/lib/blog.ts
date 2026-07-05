export interface BlogSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // YYYY-MM-DD
  readingMinutes: number;
  tag: string;
  intro: string[];
  sections: BlogSection[];
  closing: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "cara-mengelola-keuangan-pribadi",
    title: "Cara Mengelola Keuangan Pribadi: Panduan Praktis untuk Pemula",
    description:
      "Langkah-langkah sederhana mengelola keuangan pribadi: mencatat pengeluaran, menyusun anggaran, membangun dana darurat, dan memakai aplikasi pengelola keuangan secara konsisten.",
    publishedAt: "2026-06-20",
    readingMinutes: 6,
    tag: "Dasar Keuangan",
    intro: [
      "Mengelola keuangan pribadi sering terdengar rumit, padahal intinya sederhana: tahu berapa uang yang masuk, ke mana uang itu pergi, dan memastikan ada sisa untuk masa depan. Masalahnya, tanpa sistem yang jelas, kita hanya mengandalkan ingatan — dan ingatan hampir selalu kalah dari struk belanja.",
      "Panduan ini merangkum langkah-langkah praktis yang bisa langsung kamu terapkan hari ini, tanpa perlu latar belakang finansial apa pun.",
    ],
    sections: [
      {
        heading: "1. Catat setiap pemasukan dan pengeluaran",
        paragraphs: [
          "Fondasi pengelolaan keuangan adalah pencatatan. Kamu tidak bisa memperbaiki apa yang tidak kamu ukur. Mulailah mencatat setiap transaksi — sekecil apa pun — selama minimal satu bulan penuh.",
          "Gunakan alat yang paling mudah kamu akses setiap hari. Aplikasi pencatat keuangan seperti Elbimas membuat prosesnya cepat: pilih dompet, kategori, masukkan nominal, selesai dalam hitungan detik.",
        ],
      },
      {
        heading: "2. Kelompokkan pengeluaran dengan kategori",
        paragraphs: [
          "Setelah rutin mencatat, kelompokkan transaksi ke kategori seperti makanan, transportasi, tagihan, dan hiburan. Dari sini pola akan terlihat: biasanya ada satu-dua kategori yang diam-diam menyedot porsi terbesar.",
        ],
        list: [
          "Kebutuhan pokok (makan, transportasi, tagihan) — idealnya sekitar 50% penghasilan.",
          "Keinginan (hiburan, jajan, langganan) — batasi di kisaran 30%.",
          "Tabungan dan investasi — sisihkan minimal 20% di awal bulan, bukan dari sisa.",
        ],
      },
      {
        heading: "3. Susun anggaran bulanan yang realistis",
        paragraphs: [
          "Anggaran bukan hukuman, melainkan izin belanja yang kamu berikan pada diri sendiri. Tetapkan batas per kategori berdasarkan data pencatatanmu — bukan angka ideal yang mustahil dipatuhi.",
          "Pantau realisasinya sepanjang bulan. Fitur anggaran dengan progress bar membuat kamu tahu kapan harus mengerem sebelum kebablasan, bukan setelahnya.",
        ],
      },
      {
        heading: "4. Bangun dana darurat sebelum yang lain",
        paragraphs: [
          "Sebelum berpikir investasi, amankan dulu dana darurat sebesar 3–6 kali pengeluaran bulanan. Simpan di rekening terpisah yang mudah dicairkan. Fitur target tabungan membantu kamu memecah angka besar itu menjadi setoran kecil yang konsisten.",
        ],
      },
      {
        heading: "5. Evaluasi rutin setiap akhir bulan",
        paragraphs: [
          "Luangkan 15 menit tiap akhir bulan untuk melihat laporan: berapa total pemasukan, pengeluaran, dan selisihnya? Kategori mana yang melebihi anggaran? Evaluasi kecil yang rutin jauh lebih efektif daripada resolusi besar setahun sekali.",
        ],
      },
    ],
    closing:
      "Kunci pengelolaan keuangan bukan kesempurnaan, melainkan konsistensi. Mulai dari mencatat, lalu biarkan data yang memandu keputusanmu. Elbimas gratis dan bisa langsung dipakai — buat akun, tambahkan dompet pertamamu, dan catat transaksi hari ini.",
  },
  {
    slug: "aplikasi-pencatat-pengeluaran-gratis",
    title: "Memilih Aplikasi Pencatat Pengeluaran Gratis: 7 Fitur yang Wajib Ada",
    description:
      "Tidak semua aplikasi pencatat pengeluaran dibuat sama. Ini 7 fitur yang wajib kamu cek sebelum memilih aplikasi keuangan pribadi gratis: multi-dompet, anggaran, laporan, hingga keamanan data.",
    publishedAt: "2026-06-27",
    readingMinutes: 5,
    tag: "Tips Aplikasi",
    intro: [
      "Aplikasi pencatat pengeluaran gratis ada banyak — tapi yang benar-benar membuatmu bertahan mencatat lebih dari seminggu? Sedikit. Perbedaannya biasanya bukan di tampilan, melainkan di fitur inti yang menghilangkan gesekan saat mencatat dan memberi insight yang berguna.",
      "Berikut tujuh fitur yang layak jadi standar minimum sebelum kamu berkomitmen pada satu aplikasi.",
    ],
    sections: [
      {
        heading: "1. Pencatatan cepat dengan kategori",
        paragraphs: [
          "Semakin sedikit langkah untuk mencatat satu transaksi, semakin besar peluang kebiasaan itu bertahan. Cari aplikasi yang bisa mencatat dalam 3–4 ketukan, dengan kategori yang bisa disesuaikan sendiri.",
        ],
      },
      {
        heading: "2. Multi-dompet dan multi-mata uang",
        paragraphs: [
          "Uangmu tidak hanya di satu tempat: ada rekening bank, e-wallet, dan uang tunai. Aplikasi yang baik memperlakukan tiap dompet terpisah dengan saldo masing-masing, plus transfer antar dompet yang tercatat rapi.",
          "Kalau kamu punya tabungan valas atau sering bertransaksi lintas mata uang, pastikan aplikasinya mendukung kurs — nilai semua dompet tetap bisa dijumlahkan ke satu mata uang utama.",
        ],
      },
      {
        heading: "3. Anggaran bulanan per kategori",
        paragraphs: [
          "Mencatat saja tidak cukup; kamu butuh batas. Fitur anggaran per kategori dengan indikator visual (progress bar, peringatan over-budget) mengubah data pasif menjadi rem aktif.",
        ],
      },
      {
        heading: "4. Laporan dan grafik yang mudah dibaca",
        paragraphs: [
          "Grafik arus kas dan komposisi pengeluaran per kategori membantu kamu melihat pola dalam hitungan detik — jauh lebih cepat daripada membaca daftar transaksi satu per satu.",
        ],
      },
      {
        heading: "5. Transaksi berulang otomatis",
        paragraphs: [
          "Tagihan internet, listrik, langganan streaming, dan gaji datang tiap bulan. Fitur transaksi berulang mencatatnya otomatis sesuai jadwal supaya tidak ada yang terlewat atau tercatat dobel.",
        ],
      },
      {
        heading: "6. Pencatatan utang-piutang",
        paragraphs: [
          "Pinjam-meminjam dengan teman atau keluarga sering berakhir canggung karena lupa. Fitur utang-piutang dengan riwayat pembayaran menjaga semuanya transparan.",
        ],
      },
      {
        heading: "7. Keamanan dan kepemilikan data",
        paragraphs: [
          "Data keuangan itu sensitif. Minimal, aplikasi harus memakai koneksi terenkripsi (HTTPS) dan autentikasi yang benar. Nilai tambah: bisa diakses dari perangkat mana pun lewat browser tanpa tergantung satu ponsel.",
        ],
      },
    ],
    closing:
      "Elbimas dibangun dengan ketujuh fitur di atas — gratis, berbahasa Indonesia, dan berjalan di browser mana pun. Coba sendiri dan rasakan bedanya aplikasi yang dirancang untuk dipakai setiap hari.",
  },
  {
    slug: "anggaran-bulanan-metode-50-30-20",
    title: "Metode 50/30/20: Cara Simpel Menyusun Anggaran Bulanan",
    description:
      "Penjelasan metode anggaran 50/30/20 — 50% kebutuhan, 30% keinginan, 20% tabungan — beserta contoh perhitungan gaji dan cara menerapkannya dengan aplikasi pengatur anggaran bulanan.",
    publishedAt: "2026-07-01",
    readingMinutes: 4,
    tag: "Anggaran",
    intro: [
      "Dari sekian banyak metode penganggaran, 50/30/20 bertahan paling populer karena satu alasan: sederhana. Tidak perlu spreadsheet rumit — cukup bagi penghasilan bersihmu ke tiga ember besar.",
    ],
    sections: [
      {
        heading: "Apa itu metode 50/30/20?",
        paragraphs: [
          "Metode ini dipopulerkan oleh Elizabeth Warren dalam buku All Your Worth. Aturannya: alokasikan penghasilan bersih (setelah pajak) ke tiga kelompok.",
        ],
        list: [
          "50% untuk kebutuhan — sewa/cicilan rumah, makan, transportasi, listrik, internet, asuransi.",
          "30% untuk keinginan — makan di luar, hiburan, langganan, hobi, liburan.",
          "20% untuk masa depan — tabungan, dana darurat, investasi, pelunasan utang.",
        ],
      },
      {
        heading: "Contoh perhitungan",
        paragraphs: [
          "Misal gaji bersihmu Rp6.000.000 per bulan. Maka alokasinya: Rp3.000.000 untuk kebutuhan, Rp1.800.000 untuk keinginan, dan Rp1.200.000 untuk tabungan atau pelunasan utang.",
          "Angka persisnya boleh digeser sesuai kondisi — yang tinggal di kota besar mungkin butuh 60% untuk kebutuhan. Prinsipnya tetap: porsi masa depan tidak boleh nol.",
        ],
      },
      {
        heading: "Cara menerapkannya tanpa ribet",
        paragraphs: [
          "Teori mudah; praktiknya yang sulit. Tiga kebiasaan ini membantu:",
        ],
        list: [
          "Sisihkan porsi 20% di awal bulan, langsung setelah gajian — bukan menunggu sisa.",
          "Buat anggaran per kategori di aplikasi pengelola keuangan, lalu pantau progress-nya sepanjang bulan.",
          "Evaluasi tiap akhir bulan: kategori mana yang jebol, dan apakah pembagiannya masih realistis.",
        ],
      },
      {
        heading: "Menerapkan 50/30/20 di Elbimas",
        paragraphs: [
          "Di Elbimas, buat anggaran bulanan untuk tiap kategori pengeluaran sesuai porsi 50/30/20-mu. Progress bar akan menunjukkan realisasi vs batas secara real-time, lengkap dengan indikator merah saat melewati batas. Untuk porsi 20%, gunakan fitur target tabungan supaya setorannya terlacak.",
        ],
      },
    ],
    closing:
      "Anggaran terbaik adalah yang benar-benar kamu jalankan. Mulai dari pembagian kasar 50/30/20, catat realisasinya, lalu sesuaikan tiap bulan. Elbimas membantu kamu memantau semuanya secara otomatis — gratis.",
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
