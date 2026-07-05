import { z } from "zod";
import { currencyCode, dateString, positiveMoney } from "./common";

export const debtCreateSchema = z.object({
  type: z.enum(["payable", "receivable"]),
  counterparty: z.string().trim().min(1, "Nama pihak wajib diisi").max(120),
  principal_amount: positiveMoney,
  currency: currencyCode.optional(), // default: base currency user
  due_date: dateString.nullish(),
  note: z.string().trim().max(255).nullish(),
});

export const debtUpdateSchema = z.object({
  counterparty: z.string().trim().min(1).max(120).optional(),
  principal_amount: positiveMoney.optional(),
  due_date: dateString.nullish(),
  note: z.string().trim().max(255).nullish(),
});

export const debtPaymentSchema = z.object({
  amount: positiveMoney,
  wallet_id: z.number().int().positive().nullish(),
  payment_date: dateString,
  note: z.string().trim().max(255).nullish(),
});

export type DebtCreateInput = z.infer<typeof debtCreateSchema>;
export type DebtUpdateInput = z.infer<typeof debtUpdateSchema>;
export type DebtPaymentInput = z.infer<typeof debtPaymentSchema>;
