import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircleQuestion, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Hubungi tim Elbimas untuk pertanyaan, masukan fitur, atau laporan masalah keamanan pada aplikasi pengelola keuangan Elbimas.",
  alternates: { canonical: "/kontak" },
  openGraph: {
    title: "Kontak | Elbimas",
    description:
      "Hubungi tim Elbimas untuk pertanyaan, masukan fitur, atau laporan masalah.",
    url: "/kontak",
  },
  robots: { index: true, follow: true },
};

const CHANNELS = [
  {
    icon: Mail,
    title: "Pertanyaan umum & masukan",
    description:
      "Punya ide fitur, menemukan kendala, atau sekadar ingin menyapa? Kirim email dan kami akan membalas secepatnya.",
    action: { label: "halo@elbimas.app", href: "mailto:halo@elbimas.app" },
  },
  {
    icon: ShieldAlert,
    title: "Laporan keamanan",
    description:
      "Menemukan celah keamanan? Laporkan secara bertanggung jawab lewat email khusus — kami memprioritaskan setiap laporan.",
    action: {
      label: "security@elbimas.app",
      href: "mailto:security@elbimas.app",
    },
  },
  {
    icon: MessageCircleQuestion,
    title: "Pertanyaan yang sering diajukan",
    description:
      "Banyak jawaban sudah tersedia di halaman FAQ — dari keamanan data sampai cara install di HP.",
    action: { label: "Buka FAQ", href: "/faq" },
  },
];

export default function KontakPage() {
  return (
    <>
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <h1 className="font-heading max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Hubungi kami
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Masukanmu membentuk arah Elbimas. Pilih jalur yang paling sesuai di
            bawah ini.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3">
          {CHANNELS.map((channel) => (
            <article
              key={channel.title}
              className="flex flex-col rounded-2xl border bg-card p-6"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <channel.icon className="size-5.5" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-lg font-semibold">
                {channel.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {channel.description}
              </p>
              <p className="mt-4">
                <Link
                  href={channel.action.href}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {channel.action.label}
                </Link>
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
