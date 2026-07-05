import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Kamu Sedang Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <WifiOff className="size-8" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Kamu sedang offline
        </h1>
        <p className="mx-auto max-w-sm text-muted-foreground">
          Elbimas membutuhkan koneksi internet untuk memuat data keuanganmu.
          Periksa koneksimu, lalu coba lagi.
        </p>
      </div>
      <Button asChild className="h-11 px-6">
        <Link href="/dashboard">Coba Lagi</Link>
      </Button>
    </div>
  );
}
