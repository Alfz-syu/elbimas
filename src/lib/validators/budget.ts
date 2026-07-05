import { z } from "zod";
import { monthString, positiveMoney } from "./common";

export const budgetCreateSchema = z.object({
  category_id: z.number().int().positive().nullish(), // null = budget total
  amount: positiveMoney,
  period_month: monthString,
});

export const budgetUpdateSchema = z.object({
  amount: positiveMoney,
});

export type BudgetCreateInput = z.infer<typeof budgetCreateSchema>;
export type BudgetUpdateInput = z.infer<typeof budgetUpdateSchema>;
