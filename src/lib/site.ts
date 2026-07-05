export const SITE_NAME = "Elbimas";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_DESCRIPTION =
  "Website pengelola keuangan pribadi gratis: catat pemasukan & pengeluaran, kelola banyak dompet & mata uang, atur anggaran bulanan, target tabungan, utang-piutang, dan lihat laporan keuangan otomatis.";

export const SITE_KEYWORDS = [
  "website pengelola keuangan",
  "aplikasi pencatat keuangan",
  "pengelola keuangan online",
  "aplikasi keuangan pribadi gratis",
  "aplikasi pencatat pengeluaran",
  "pengatur anggaran bulanan",
];

export interface PublicNavItem {
  href: string;
  label: string;
}

export const PUBLIC_NAV: PublicNavItem[] = [
  { href: "/fitur", label: "Fitur" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/tentang", label: "Tentang" },
  { href: "/kontak", label: "Kontak" },
];
