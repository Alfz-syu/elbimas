import {
  Banknote,
  Landmark,
  Smartphone,
  CreditCard,
  TrendingUp,
  CircleEllipsis,
  type LucideIcon,
} from "lucide-react";
import type { WalletType } from "@/db/schema-types";

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-Wallet",
  credit_card: "Kartu Kredit",
  investment: "Investasi",
  other: "Lainnya",
};

export const WALLET_TYPE_ICONS: Record<WalletType, LucideIcon> = {
  cash: Banknote,
  bank: Landmark,
  ewallet: Smartphone,
  credit_card: CreditCard,
  investment: TrendingUp,
  other: CircleEllipsis,
};

/** Pilihan warna dompet — selaras palet brand. */
export const WALLET_COLORS = [
  "#0E7B5D",
  "#0D9488",
  "#0284C7",
  "#4F46E5",
  "#9333EA",
  "#DB2777",
  "#DC2626",
  "#EA580C",
  "#D97706",
  "#64748B",
] as const;
