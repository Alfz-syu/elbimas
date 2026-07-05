import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(120, "Nama maksimal 120 karakter"),
  email: z.email("Format email tidak valid").max(255).toLowerCase(),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
  base_currency: z
    .string()
    .length(3, "Kode mata uang harus 3 huruf")
    .toUpperCase(),
});

export const loginSchema = z.object({
  email: z.email("Format email tidak valid").max(255).toLowerCase(),
  password: z.string().min(1, "Password wajib diisi").max(72),
});

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(120, "Nama maksimal 120 karakter")
    .optional(),
  base_currency: z
    .string()
    .length(3, "Kode mata uang harus 3 huruf")
    .toUpperCase()
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
