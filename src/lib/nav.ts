import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  PiggyBank,
  HandCoins,
  Repeat,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/wallets", label: "Dompet", icon: Wallet },
  { href: "/budgets", label: "Anggaran", icon: PieChart },
  { href: "/goals", label: "Target", icon: PiggyBank },
  { href: "/debts", label: "Utang Piutang", icon: HandCoins },
  { href: "/recurring", label: "Berulang", icon: Repeat },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

/** Item utama untuk bottom nav mobile (maks 5). */
export const MOBILE_NAV_ITEMS = NAV_ITEMS.slice(0, 4);
