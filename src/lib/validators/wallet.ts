import { z } from "zod";
import { currencyCode, nonNegativeMoney, moneyString } from "./common";

export const walletTypeEnum = z.enum([
  "cash",
  "bank",
  "ewallet",
  "credit_card",
  "investment",
  "other",
]);

export const walletCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(120),
  type: walletTypeEnum.default("cash"),
  currency: currencyCode,
  initial_balance: moneyString.default("0"),
  color: z.string().max(16).nullish(),
  icon: z.string().max(40).nullish(),
});

export const walletUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  type: walletTypeEnum.optional(),
  initial_balance: moneyString.optional(),
  color: z.string().max(16).nullish(),
  icon: z.string().max(40).nullish(),
  is_archived: z.boolean().optional(),
});

export const transferCreateSchema = z
  .object({
    from_wallet_id: z.number().int().positive(),
    to_wallet_id: z.number().int().positive(),
    from_amount: nonNegativeMoney,
    to_amount: nonNegativeMoney,
    fee: nonNegativeMoney.default("0"),
    note: z.string().trim().max(255).nullish(),
    transfer_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  })
  .refine((v) => v.from_wallet_id !== v.to_wallet_id, {
    message: "Dompet asal dan tujuan tidak boleh sama",
    path: ["to_wallet_id"],
  });

export type WalletCreateInput = z.infer<typeof walletCreateSchema>;
export type WalletUpdateInput = z.infer<typeof walletUpdateSchema>;
export type TransferCreateInput = z.infer<typeof transferCreateSchema>;
