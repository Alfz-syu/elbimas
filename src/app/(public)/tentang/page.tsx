import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, HeartHandshake, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tentang Elbimas",
  description:
    "Elbimas adalah website pengelola keuangan pribadi gratis berbahasa Indonesia. Kenali misi kami: membuat pencatatan keuangan jadi kebiasaan yang mudah dan bertahan.",
  alternates: { canonical: "/tentang" },
  openGraph: {
    title: "Tentang Elbimas",
    description:
      "Misi kami: membuat pencatatan keuangan jadi kebiasaan yang mudah dan bertahan — gratis untuk semua orang Indonesia.",
    url: "/tentang",
  },
  robots: { index: true, follow: true },
};

const VALUES = [
  {
    icon: HeartHandshake,
    title: "Gratis tanpa syarat",
    description:
      "Semua fitur bisa dipakai tanpa biaya, tanpa iklan yang mengganggu, dan tanpa paket premium tersembunyi.",
  },
  {
    icon: Lock,
    title: "Datamu, milikmu",
    description:
      "Kami tidak menjual data. Catatan keuanganmu terisolasi per akun dan hanya bisa diakses olehmu.",
  },
  {
    icon: Eye,
    title: "Sederhana itu disengaja",
    description:
      "Setiap layar dirancang supaya pencatatan selesai dalam hitungan detik — karena kebiasaan hanya bertahan kalau terasa ringan.",
  },
];

export default function TentangPage() {
  return (
    <>
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <h1 className="font-heading max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Membuat keuangan yang sehat terasa mudah
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Elbimas lahir dari masalah sederhana: kebanyakan orang tahu mereka
            perlu mencatat keuangan, tapi berhenti setelah minggu pertama.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-3xl space-y-6 px-4 text-lg leading-relaxed sm:px-6">
          <p>
            Spreadsheet terlalu ribet. Aplikasi keuangan yang ada sering penuh
            iklan, berbayar untuk fitur dasar, atau berbahasa asing dengan
            format angka yang tidak cocok. Akhirnya banyak dari kita kembali
            ke cara lama: mengandalkan ingatan — dan kaget setiap akhir bulan.
          </p>
          <p>
            Elbimas dibangun sebagai jawaban: aplikasi pengelola keuangan
            pribadi berbahasa Indonesia yang gratis, cepat, dan cukup lengkap
            untuk kebutuhan nyata — dari pencatatan harian, banyak dompet dan
            mata uang, anggaran bulanan, target tabungan, sampai utang-piutang
            dengan riwayat pembayarannya.
          </p>
          <p>
            Karena berjalan di browser, Elbimas bisa dipakai dari perangkat apa
            pun tanpa instalasi — dan tetap bisa dipasang di home screen HP
            layaknya aplikasi native.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="nilai-heading"
        className="border-t bg-muted/40 py-14 md:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2
            id="nilai-heading"
            className="font-heading mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Prinsip yang kami pegang
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {VALUES.map((value) => (
              <article
                key={value.title}
                className="rounded-2xl border bg-card p-6 text-center"
              >
                <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <value.icon className="size-5.5" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-lg font-semibold">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Mulai perjalanan keuanganmu
          </h2>
          <div className="mt-6">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/register">
                Buat Akun Gratis
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
