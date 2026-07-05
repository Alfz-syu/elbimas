import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/public/json-ld";

export const metadata: Metadata = {
  title: "Pertanyaan yang Sering Diajukan (FAQ)",
  description:
    "Jawaban atas pertanyaan umum tentang Elbimas: apakah benar-benar gratis, keamanan data, dukungan multi-mata uang, cara install di HP, dan lainnya.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ | Elbimas",
    description:
      "Jawaban atas pertanyaan umum tentang aplikasi pengelola keuangan Elbimas.",
    url: "/faq",
  },
  robots: { index: true, follow: true },
};

const FAQS = [
  {
    question: "Apakah Elbimas benar-benar gratis?",
    answer:
      "Ya. Semua fitur — pencatatan transaksi, multi-dompet, anggaran, target tabungan, utang-piutang, transaksi berulang, dan laporan — bisa dipakai tanpa biaya. Tidak ada paket premium tersembunyi dan tidak ada iklan.",
  },
  {
    question: "Apakah data keuangan saya aman?",
    answer:
      "Data akunmu dilindungi autentikasi terenkripsi (password di-hash, sesi memakai token aman httpOnly) dan setiap akun terisolasi — pengguna lain tidak bisa mengakses datamu. Kami juga tidak menjual atau membagikan data ke pihak ketiga.",
  },
  {
    question: "Apakah Elbimas mendukung lebih dari satu mata uang?",
    answer:
      "Ya. Kamu bisa membuat dompet dalam 20+ mata uang (IDR, USD, EUR, SGD, JPY, dan lainnya). Kurs bisa disinkronkan otomatis dari sumber publik atau diatur manual, dan laporan menampilkan total yang terkonversi ke mata uang utamamu.",
  },
  {
    question: "Bisakah Elbimas di-install di HP seperti aplikasi biasa?",
    answer:
      "Bisa. Elbimas adalah PWA (Progressive Web App) — buka situsnya di browser HP, pilih \"Tambahkan ke layar utama\", dan ikonnya muncul seperti aplikasi native tanpa lewat app store.",
  },
  {
    question: "Bagaimana cara mencatat tagihan atau langganan bulanan?",
    answer:
      "Gunakan fitur Transaksi Berulang. Tentukan nominal, dompet, frekuensi (harian/mingguan/bulanan/tahunan), dan tanggal mulainya — Elbimas akan mencatatnya otomatis sesuai jadwal, termasuk mengejar periode yang terlewat.",
  },
  {
    question: "Apakah saya bisa mencatat utang dan piutang?",
    answer:
      "Bisa. Modul Utang Piutang mencatat pinjaman yang kamu terima maupun berikan, lengkap dengan jatuh tempo, riwayat pembayaran, dan status (belum dibayar/sebagian/lunas) yang diperbarui otomatis dari total pembayaran.",
  },
  {
    question: "Apakah harus install aplikasi atau bisa langsung dari browser?",
    answer:
      "Langsung dari browser — desktop, tablet, maupun HP. Tidak perlu instalasi. Kalau mau akses lebih cepat di HP, pasang sebagai PWA ke layar utama.",
  },
  {
    question: "Bagaimana kalau saya punya rekening dengan mata uang asing?",
    answer:
      "Buat dompet dengan mata uang tersebut. Transaksi dicatat dalam mata uang asli dompet, dan di laporan nilainya dikonversi otomatis ke mata uang utamamu memakai kurs tersimpan — lengkap dengan penanda bahwa itu hasil konversi.",
  },
];

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }}
      />

      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <h1 className="font-heading max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Pertanyaan yang sering diajukan
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Belum menemukan jawabanmu?{" "}
            <Link href="/kontak" className="text-primary underline-offset-4 hover:underline">
              Hubungi kami
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <dl className="divide-y">
            {FAQS.map((faq) => (
              <div key={faq.question} className="py-6">
                <dt className="font-heading text-lg font-semibold">
                  {faq.question}
                </dt>
                <dd className="mt-2 leading-relaxed text-muted-foreground">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 rounded-2xl border bg-muted/40 p-8 text-center">
            <h2 className="font-heading text-xl font-semibold">
              Siap mencoba sendiri?
            </h2>
            <div className="mt-4">
              <Button asChild className="h-11 px-6">
                <Link href="/register">
                  Daftar Gratis
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
