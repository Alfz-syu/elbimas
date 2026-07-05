import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PUBLIC_NAV } from "@/lib/site";

const PRODUCT_LINKS = [
  { href: "/register", label: "Daftar Gratis" },
  { href: "/login", label: "Masuk" },
  { href: "/fitur", label: "Semua Fitur" },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo textClassName="text-sidebar-foreground" />
          <p className="max-w-sm text-sm text-sidebar-foreground/70">
            Website pengelola keuangan pribadi gratis berbahasa Indonesia —
            catat transaksi, atur anggaran, capai target tabunganmu.
          </p>
        </div>

        <nav aria-label="Tautan halaman">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            Jelajahi
          </h2>
          <ul className="space-y-2">
            {PUBLIC_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-sidebar-foreground/80 transition-colors hover:text-sidebar-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Tautan produk">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            Produk
          </h2>
          <ul className="space-y-2">
            {PRODUCT_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-sidebar-foreground/80 transition-colors hover:text-sidebar-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-sidebar-border">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-sidebar-foreground/60 sm:px-6">
          © {new Date().getFullYear()} Elbimas. Aplikasi pengelola keuangan
          pribadi gratis.
        </p>
      </div>
    </footer>
  );
}
