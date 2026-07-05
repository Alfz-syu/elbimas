import { z } from "zod";
import { currencyCode, dateString, positiveMoney } from "./common";

export const goalCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(120),
  target_amount: positiveMoney,
  currency: currencyCode.optional(), // default: base currency user
  wallet_id: z.number().int().positive().nullish(),
  target_date: dateString.nullish(),
});

export const goalUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  target_amount: positiveMoney.optional(),
  wallet_id: z.number().int().positive().nullish(),
  target_date: dateString.nullish(),
});

export const goalContributeSchema = z.object({
  amount: positiveMoney,
});

export type GoalCreateInput = z.infer<typeof goalCreateSchema>;
export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>;
export type GoalContributeInput = z.infer<typeof goalContributeSchema>;
