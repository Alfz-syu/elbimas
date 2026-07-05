import { z } from "zod";
import Decimal from "decimal.js";

/** String angka desimal valid (input uang). Diterima string atau number. */
export const moneyString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => {
    if (!/^-?\d+(\.\d+)?$/.test(v)) return false;
    try {
      new Decimal(v);
      return true;
    } catch {
      return false;
    }
  }, "Nominal tidak valid");

/** Nominal uang >= 0. */
export const nonNegativeMoney = moneyString.refine(
  (v) => new Decimal(v).gte(0),
  "Nominal tidak boleh negatif"
);

/** Nominal uang > 0. */
export const positiveMoney = moneyString.refine(
  (v) => new Decimal(v).gt(0),
  "Nominal harus lebih dari 0"
);

/** Tanggal 'YYYY-MM-DD'. */
export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), {
    message: "Tanggal tidak valid",
  });

/** Bulan 'YYYY-MM'. */
export const monthString = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Format bulan harus YYYY-MM");

export const currencyCode = z
  .string()
  .length(3, "Kode mata uang harus 3 huruf")
  .toUpperCase();

export const idParam = z.coerce.number().int().positive();
