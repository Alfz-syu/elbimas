import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeftRight,
  Globe2,
  HandCoins,
  LineChart,
  PieChart,
  PiggyBank,
  Repeat,
  ShieldCheck,
  Smartphone,
  Tags,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Fitur Lengkap Aplikasi Pengelola Keuangan",
  description:
    "Jelajahi fitur Elbimas: pencatatan transaksi, multi-dompet & multi-mata uang, transfer antar dompet, anggaran bulanan, target tabungan, utang-piutang, transaksi berulang, dan laporan keuangan.",
  alternates: { canonical: "/fitur" },
  openGraph: {
    title: "Fitur Lengkap Aplikasi Pengelola Keuangan | Elbimas",
    description:
      "Pencatatan transaksi, multi-dompet, anggaran, target tabungan, utang-piutang, transaksi berulang, dan laporan keuangan — semua gratis.",
    url: "/fitur",
  },
  robots: { index: true, follow: true },
};

const FEATURE_GROUPS = [
  {
    title: "Pencatatan harian",
    description: "Fondasi keuangan yang sehat dimulai dari catatan yang rapi.",
    features: [
      {
        icon: ArrowLeftRight,
        name: "Transaksi cepat",
        detail:
          "Catat pemasukan dan pengeluaran dalam hitungan detik — pilih dompet, kategori, nominal, selesai. Dilengkapi filter, pencarian catatan, dan pengelompokan per tanggal.",
      },
      {
        icon: Tags,
        name: "Kategori fleksibel",
        detail:
          "15 kategori standar langsung tersedia saat daftar, dan kamu bebas menambah, mengubah, atau menyusun sub-kategori sesuai gaya hidupmu.",
      },
      {
        icon: Repeat,
        name: "Transaksi berulang",
        detail:
          "Jadwalkan tagihan internet, langganan streaming, atau gaji bulanan — harian, mingguan, bulanan, atau tahunan. Elbimas mencatatnya otomatis sesuai jadwal, termasuk periode yang terlewat.",
      },
    ],
  },
  {
    title: "Dompet & mata uang",
    description: "Semua tempat uangmu berada, terpantau dari satu dashboard.",
    features: [
      {
        icon: Wallet,
        name: "Multi-dompet",
        detail:
          "Rekening bank, e-wallet, uang tunai, sampai rekening valas — masing-masing dengan saldo real-time yang dihitung otomatis dari transaksimu.",
      },
      {
        icon: Globe2,
        name: "Multi-mata uang + kurs",
        detail:
          "Dukungan 20+ mata uang. Sinkronkan kurs otomatis dari sumber publik atau atur kurs manual — total kekayaanmu tetap terkonversi rapi ke satu mata uang utama.",
      },
      {
        icon: ArrowLeftRight,
        name: "Transfer antar dompet",
        detail:
          "Pindahkan dana antar dompet — termasuk beda mata uang dengan nominal diterima dan biaya transfer yang tercatat akurat, tanpa mengacaukan laporan.",
      },
    ],
  },
  {
    title: "Perencanaan & kontrol",
    description: "Bukan sekadar mencatat — kendalikan arah uangmu.",
    features: [
      {
        icon: PieChart,
        name: "Anggaran bulanan",
        detail:
          "Tetapkan batas belanja per kategori atau total per bulan. Progress bar menunjukkan realisasi vs batas, dengan indikator merah saat over-budget.",
      },
      {
        icon: PiggyBank,
        name: "Target tabungan",
        detail:
          "Buat target seperti dana darurat atau liburan, lalu isi kontribusinya bertahap. Persentase progres dan status tercapai terhitung otomatis.",
      },
      {
        icon: HandCoins,
        name: "Utang & piutang",
        detail:
          "Catat pinjaman yang kamu terima maupun berikan, lengkap dengan jatuh tempo dan riwayat pembayaran. Status lunas/sebagian diperbarui otomatis.",
      },
    ],
  },
  {
    title: "Wawasan & akses",
    description: "Data keuanganmu bekerja untukmu, di mana pun.",
    features: [
      {
        icon: LineChart,
        name: "Dashboard & laporan",
        detail:
          "Grafik arus kas harian, komposisi pengeluaran per kategori, total saldo lintas dompet, dan ringkasan bulanan — semua diperbarui otomatis.",
      },
      {
        icon: Smartphone,
        name: "Bisa di-install (PWA)",
        detail:
          "Pasang Elbimas di home screen HP seperti aplikasi native — tanpa lewat app store, selalu versi terbaru.",
      },
      {
        icon: ShieldCheck,
        name: "Aman & privat",
        detail:
          "Autentikasi terenkripsi, sesi aman, dan datamu terisolasi per akun. Tanpa iklan, tanpa jual data.",
      },
    ],
  },
];

export default function FiturPage() {
  return (
    <>
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <h1 className="font-heading max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Fitur lengkap untuk mengelola keuangan pribadimu
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Setiap fitur Elbimas dirancang untuk satu tujuan: membuat
            pencatatan keuangan terasa ringan sehingga jadi kebiasaan yang
            bertahan.
          </p>
        </div>
      </section>

      {FEATURE_GROUPS.map((group, index) => (
        <section
          key={group.title}
          aria-labelledby={`grup-${index}`}
          className={index % 2 === 1 ? "bg-muted/40 py-14 md:py-20" : "py-14 md:py-20"}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 max-w-2xl">
              <h2
                id={`grup-${index}`}
                className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
              >
                {group.title}
              </h2>
              <p className="mt-2 text-muted-foreground">{group.description}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {group.features.map((feature) => (
                <article
                  key={feature.name}
                  className="rounded-2xl border bg-card p-6"
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <feature.icon className="size-5.5" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold">
                    {feature.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Siap mencoba semuanya?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Semua fitur di atas gratis — tidak ada paket premium tersembunyi.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/register">
                Daftar Gratis
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
