import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Globe2,
  HandCoins,
  LineChart,
  PieChart,
  PiggyBank,
  Repeat,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/public/json-ld";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Elbimas — Website Pengelola Keuangan Pribadi Gratis",
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: SITE_NAME,
    title: "Elbimas — Website Pengelola Keuangan Pribadi Gratis",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Elbimas — Website Pengelola Keuangan Pribadi Gratis",
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const FEATURES = [
  {
    icon: Wallet,
    title: "Multi-dompet & multi-mata uang",
    description:
      "Kelola rekening bank, e-wallet, dan uang tunai terpisah — termasuk dompet valas dengan kurs yang bisa disinkronkan otomatis.",
  },
  {
    icon: LineChart,
    title: "Laporan & grafik otomatis",
    description:
      "Arus kas harian, komposisi pengeluaran per kategori, dan ringkasan bulanan tersaji dalam grafik yang mudah dibaca.",
  },
  {
    icon: PieChart,
    title: "Anggaran bulanan",
    description:
      "Tetapkan batas belanja per kategori dan pantau realisasinya lewat progress bar — lengkap dengan peringatan over-budget.",
  },
  {
    icon: PiggyBank,
    title: "Target tabungan",
    description:
      "Pecah tujuan besar jadi setoran kecil yang terlacak. Progres tiap kontribusi terlihat jelas sampai target tercapai.",
  },
  {
    icon: HandCoins,
    title: "Utang & piutang",
    description:
      "Catat pinjaman yang kamu berikan maupun terima, beserta riwayat pembayarannya. Status lunas terhitung otomatis.",
  },
  {
    icon: Repeat,
    title: "Transaksi berulang",
    description:
      "Tagihan internet, langganan, dan gaji rutin dicatat otomatis sesuai jadwal — tidak ada yang terlewat.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Daftar & pilih mata uang utama",
    description:
      "Buat akun gratis dalam satu menit. Kategori pemasukan dan pengeluaran standar langsung tersedia.",
  },
  {
    number: "02",
    title: "Tambahkan dompetmu",
    description:
      "Masukkan rekening bank, e-wallet, atau uang tunai beserta saldo awalnya — berapa pun jumlah dompetnya.",
  },
  {
    number: "03",
    title: "Catat & pantau",
    description:
      "Catat transaksi harian dalam hitungan detik, lalu biarkan laporan, anggaran, dan grafik bekerja untukmu.",
  },
];

export default function LandingPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: SITE_NAME,
          url: SITE_URL,
          description: SITE_DESCRIPTION,
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          inLanguage: "id",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "IDR",
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          logo: `${SITE_URL}/icons/icon-512.png`,
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_70%_-10%,color-mix(in_oklab,var(--color-primary)_10%,transparent),transparent)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck
                className="size-3.5 text-primary"
                aria-hidden="true"
              />
              Gratis, tanpa iklan, data milikmu sendiri
            </p>
            <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Website pengelola keuangan pribadi yang{" "}
              <span className="text-primary">benar-benar kamu pakai</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Catat pemasukan dan pengeluaran dalam hitungan detik, kelola
              banyak dompet dan mata uang, atur anggaran bulanan, dan capai
              target tabunganmu — semua dari satu aplikasi keuangan gratis
              berbahasa Indonesia.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href="/register">
                  Mulai Gratis Sekarang
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-6 text-base"
              >
                <Link href="/fitur">Lihat Semua Fitur</Link>
              </Button>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Globe2 className="size-4 text-primary" aria-hidden="true" />
                20+ mata uang
              </li>
              <li className="flex items-center gap-1.5">
                <Smartphone
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                Bisa di-install di HP
              </li>
              <li className="flex items-center gap-1.5">
                <BellRing className="size-4 text-primary" aria-hidden="true" />
                Tagihan rutin otomatis
              </li>
            </ul>
          </div>

          {/* Mockup dashboard (ilustrasi CSS, bukan gambar) */}
          <div aria-hidden="true" className="relative hidden lg:block">
            <div className="rounded-2xl border bg-card p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="h-2.5 w-24 rounded bg-muted" />
                  <div className="mt-2 h-4 w-36 rounded bg-foreground/80" />
                </div>
                <div className="size-9 rounded-full bg-primary/15" />
              </div>
              <div className="mb-4 grid grid-cols-3 gap-3">
                {["bg-primary/15", "bg-warning/20", "bg-destructive/10"].map(
                  (bg, i) => (
                    <div key={i} className={`rounded-xl ${bg} p-3`}>
                      <div className="h-2 w-12 rounded bg-foreground/20" />
                      <div className="mt-2 h-3.5 w-16 rounded bg-foreground/60" />
                    </div>
                  )
                )}
              </div>
              <div className="rounded-xl border p-4">
                <div className="mb-3 h-2.5 w-20 rounded bg-muted" />
                <div className="flex h-28 items-end gap-2">
                  {[40, 65, 30, 80, 55, 90, 45, 70, 60, 85, 50, 75].map(
                    (h, i) => (
                      <div
                        key={i}
                        style={{ height: `${h}%` }}
                        className={`flex-1 rounded-t ${i % 3 === 2 ? "bg-warning/60" : "bg-primary/70"}`}
                      />
                    )
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-muted" />
                    <div className="flex-1">
                      <div className="h-2.5 w-28 rounded bg-foreground/40" />
                      <div className="mt-1.5 h-2 w-16 rounded bg-muted" />
                    </div>
                    <div className="h-3 w-20 rounded bg-primary/50" />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -left-8 w-44 rounded-xl border bg-card p-4 shadow-lg">
              <div className="h-2 w-16 rounded bg-muted" />
              <div className="mt-2 h-3 w-24 rounded bg-primary/60" />
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div className="h-2 w-3/4 rounded-full bg-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section
        aria-labelledby="fitur-heading"
        className="border-t bg-muted/40 py-16 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2
              id="fitur-heading"
              className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Semua kebutuhan pencatatan keuangan, satu tempat
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Dari catatan harian sampai laporan bulanan — dirancang supaya
              kebiasaan mencatatmu bertahan.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="size-5.5" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Cara kerja */}
      <section
        aria-labelledby="langkah-heading"
        className="py-16 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2
              id="langkah-heading"
              className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Mulai dalam tiga langkah
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Tanpa kartu kredit, tanpa instalasi — cukup browser.
            </p>
          </div>
          <ol className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.number} className="relative">
                <span
                  aria-hidden="true"
                  className="font-heading text-4xl font-bold text-primary"
                >
                  {step.number}
                </span>
                <h3 className="mt-2 font-heading text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section aria-labelledby="cta-heading" className="pb-16 md:pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-sidebar px-6 py-14 text-center text-sidebar-foreground sm:px-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_50%_120%,color-mix(in_oklab,var(--color-primary)_25%,transparent),transparent)]"
            />
            <h2
              id="cta-heading"
              className="font-heading relative text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Uangmu, kendali penuh di tanganmu
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-lg text-sidebar-foreground/80">
              Bergabung gratis dan rasakan bedanya punya catatan keuangan yang
              rapi — mulai bulan ini juga.
            </p>
            <div className="relative mt-8">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link href="/register">
                  Buat Akun Gratis
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
