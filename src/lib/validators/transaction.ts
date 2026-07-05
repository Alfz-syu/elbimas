import { z } from "zod";
import Decimal from "decimal.js";
import { dateString, moneyString, positiveMoney } from "./common";

const fxRate = moneyString.refine(
  (v) => new Decimal(v).gt(0),
  "Kurs harus lebih dari 0"
);

export const transactionCreateSchema = z.object({
  wallet_id: z.number().int().positive(),
  category_id: z.number().int().positive().nullish(),
  type: z.enum(["income", "expense"]),
  amount: positiveMoney,
  fx_rate_to_base: fxRate.optional(), // default: kurs tersimpan / 1
  note: z.string().trim().max(255).nullish(),
  transaction_date: dateString,
});

export const transactionUpdateSchema = z.object({
  wallet_id: z.number().int().positive().optional(),
  category_id: z.number().int().positive().nullish(),
  type: z.enum(["income", "expense"]).optional(),
  amount: positiveMoney.optional(),
  fx_rate_to_base: fxRate.optional(),
  note: z.string().trim().max(255).nullish(),
  transaction_date: dateString.optional(),
});

export const transactionListQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
  wallet_id: z.coerce.number().int().positive().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  type: z.enum(["income", "expense"]).optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;
