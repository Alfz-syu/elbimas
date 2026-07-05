import { z } from "zod";
import { dateString, positiveMoney } from "./common";

export const recurringFrequency = z.enum([
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

export const recurringCreateSchema = z.object({
  wallet_id: z.number().int().positive(),
  category_id: z.number().int().positive().nullish(),
  type: z.enum(["income", "expense"]),
  amount: positiveMoney,
  frequency: recurringFrequency,
  interval_count: z.number().int().min(1).max(365).default(1),
  next_run_date: dateString,
  end_date: dateString.nullish(),
  note: z.string().trim().max(255).nullish(),
});

export const recurringUpdateSchema = z.object({
  wallet_id: z.number().int().positive().optional(),
  category_id: z.number().int().positive().nullish(),
  type: z.enum(["income", "expense"]).optional(),
  amount: positiveMoney.optional(),
  frequency: recurringFrequency.optional(),
  interval_count: z.number().int().min(1).max(365).optional(),
  next_run_date: dateString.optional(),
  end_date: dateString.nullish(),
  note: z.string().trim().max(255).nullish(),
  is_active: z.boolean().optional(),
});

export type RecurringCreateInput = z.infer<typeof recurringCreateSchema>;
export type RecurringUpdateInput = z.infer<typeof recurringUpdateSchema>;
