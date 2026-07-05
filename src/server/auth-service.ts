import { db } from "@/db/client";
import { hashPassword, verifyPassword, type SessionUser } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import type { RegisterInput, LoginInput } from "@/lib/validators/auth";

/** Kategori default yang dibuat otomatis untuk user baru (PRD Bagian 7). */
const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
}> = [
  { name: "Gaji", type: "income", color: "#0E7B5D", icon: "briefcase" },
  { name: "Bonus & THR", type: "income", color: "#14B8A6", icon: "gift" },
  { name: "Bisnis", type: "income", color: "#0284C7", icon: "store" },
  { name: "Investasi", type: "income", color: "#7C3AED", icon: "trending-up" },
  {
    name: "Pemasukan Lain",
    type: "income",
    color: "#64748B",
    icon: "circle-plus",
  },
  { name: "Makan & Minum", type: "expense", color: "#EA580C", icon: "utensils" },
  { name: "Transportasi", type: "expense", color: "#0284C7", icon: "car" },
  { name: "Belanja", type: "expense", color: "#DB2777", icon: "shopping-bag" },
  {
    name: "Tagihan & Utilitas",
    type: "expense",
    color: "#D97706",
    icon: "receipt",
  },
  { name: "Kesehatan", type: "expense", color: "#DC2626", icon: "heart-pulse" },
  {
    name: "Pendidikan",
    type: "expense",
    color: "#4F46E5",
    icon: "graduation-cap",
  },
  { name: "Hiburan", type: "expense", color: "#9333EA", icon: "clapperboard" },
  { name: "Rumah Tangga", type: "expense", color: "#0D9488", icon: "home" },
  { name: "Donasi & Sosial", type: "expense", color: "#16A34A", icon: "hand-heart" },
  {
    name: "Pengeluaran Lain",
    type: "expense",
    color: "#64748B",
    icon: "circle-minus",
  },
];

export async function registerUser(input: RegisterInput): Promise<SessionUser> {
  const existing = await db
    .selectFrom("users")
    .select("id")
    .where("email", "=", input.email)
    .executeTakeFirst();
  if (existing) {
    throw new ApiError(409, "Email sudah terdaftar", "EMAIL_TAKEN");
  }

  const currency = await db
    .selectFrom("currencies")
    .select("code")
    .where("code", "=", input.base_currency)
    .executeTakeFirst();
  if (!currency) {
    throw new ApiError(422, "Mata uang tidak dikenal", "INVALID_CURRENCY");
  }

  const password_hash = await hashPassword(input.password);

  return db.transaction().execute(async (trx) => {
    const result = await trx
      .insertInto("users")
      .values({
        email: input.email,
        password_hash,
        name: input.name,
        base_currency: input.base_currency,
      })
      .executeTakeFirstOrThrow();
    const userId = Number(result.insertId);

    await trx
      .insertInto("categories")
      .values(
        DEFAULT_CATEGORIES.map((c) => ({
          user_id: userId,
          name: c.name,
          type: c.type,
          parent_id: null,
          color: c.color,
          icon: c.icon,
        }))
      )
      .execute();

    return {
      id: userId,
      email: input.email,
      name: input.name,
      base_currency: input.base_currency,
    };
  });
}

export async function loginUser(input: LoginInput): Promise<SessionUser> {
  const user = await db
    .selectFrom("users")
    .select(["id", "email", "name", "base_currency", "password_hash"])
    .where("email", "=", input.email)
    .executeTakeFirst();

  // Pesan sengaja sama untuk email tak terdaftar vs password salah
  const invalid = new ApiError(
    401,
    "Email atau password salah",
    "INVALID_CREDENTIALS"
  );
  if (!user) throw invalid;

  const ok = await verifyPassword(input.password, user.password_hash);
  if (!ok) throw invalid;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    base_currency: user.base_currency,
  };
}
