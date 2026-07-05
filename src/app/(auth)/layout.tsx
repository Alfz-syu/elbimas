import Link from "next/link";
import { ShieldCheck, PiggyBank, LineChart } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[5fr_7fr]">
      {/* Panel brand — hijau gelap, identitas Elbimas */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-40 size-125 rounded-full bg-sidebar-primary/10 blur-3xl"
        />
        <Link href="/" className="w-fit">
          <Logo
            markClassName="bg-sidebar-primary text-sidebar-primary-foreground"
            textClassName="text-sidebar-foreground"
          />
        </Link>

        <div className="space-y-8">
          <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight">
            Uangmu, teratur.
            <br />
            <span className="text-sidebar-primary">Hidupmu, tenang.</span>
          </h1>
          <p className="max-w-md text-sidebar-foreground/75">
            Catat pemasukan dan pengeluaran, kelola banyak dompet dan mata
            uang, pantau budget serta target tabungan — semuanya di satu
            tempat.
          </p>
          <ul className="space-y-3 text-sm text-sidebar-foreground/85">
            <li className="flex items-center gap-3">
              <PiggyBank className="size-4.5 text-sidebar-primary" aria-hidden="true" />
              Budget bulanan &amp; target tabungan
            </li>
            <li className="flex items-center gap-3">
              <LineChart className="size-4.5 text-sidebar-primary" aria-hidden="true" />
              Laporan &amp; grafik multi mata uang
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4.5 text-sidebar-primary" aria-hidden="true" />
              Data terisolasi &amp; aman per akun
            </li>
          </ul>
        </div>

        <p className="text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} Elbimas
        </p>
      </aside>

      {/* Area form */}
      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="mb-8 lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
