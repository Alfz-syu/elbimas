import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(120),
  type: z.enum(["income", "expense"]),
  parent_id: z.number().int().positive().nullish(),
  color: z.string().max(16).nullish(),
  icon: z.string().max(40).nullish(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  parent_id: z.number().int().positive().nullish(),
  color: z.string().max(16).nullish(),
  icon: z.string().max(40).nullish(),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
