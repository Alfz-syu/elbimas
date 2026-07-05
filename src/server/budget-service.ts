import { sql } from "kysely";
import { db } from "@/db/client";
import { ApiError, notFound } from "@/lib/api";
import { dec, toDbMoney } from "@/lib/money";
import type {
  BudgetCreateInput,
  BudgetUpdateInput,
} from "@/lib/validators/budget";
import type { SessionUser } from "@/lib/auth";

export interface BudgetWithActual {
  id: number;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  amount: string;
  currency: string;
  period_month: string;
  spent: string;
  remaining: string;
  percentage: number;
  is_over: boolean;
}

function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(last).padStart(2, "0")}`,
  };
}

/**
 * Budget + realisasi. Realisasi = SUM(amount × fx_rate_to_base) transaksi
 * expense bulan itu — per kategori untuk budget kategori, semua kategori
 * untuk budget total (category_id NULL). Nilai dalam base currency user.
 */
export async function listBudgetsWithActuals(
  user: SessionUser,
  month: string
): Promise<BudgetWithActual[]> {
  const { from, to } = monthRange(month);

  const [budgets, spentRows, totalSpentRow] = await Promise.all([
    db
      .selectFrom("budgets")
      .leftJoin("categories", "categories.id", "budgets.category_id")
      .select([
        "budgets.id",
        "budgets.category_id",
        "categories.name as category_name",
        "categories.color as category_color",
        "categories.icon as category_icon",
        "budgets.amount",
        "budgets.currency",
        "budgets.period_month",
      ])
      .where("budgets.user_id", "=", user.id)
      .where("budgets.period_month", "=", month)
      .orderBy(sql`budgets.category_id IS NULL`, "desc")
      .orderBy("categories.name")
      .execute(),
    db
      .selectFrom("transactions")
      .select([
        "category_id",
        sql<string>`SUM(amount * fx_rate_to_base)`.as("total"),
      ])
      .where("user_id", "=", user.id)
      .where("type", "=", "expense")
      .where("transaction_date", ">=", sql<Date>`${from}`)
      .where("transaction_date", "<=", sql<Date>`${to}`)
      .groupBy("category_id")
      .execute(),
    db
      .selectFrom("transactions")
      .select(sql<string>`COALESCE(SUM(amount * fx_rate_to_base), 0)`.as("total"))
      .where("user_id", "=", user.id)
      .where("type", "=", "expense")
      .where("transaction_date", ">=", sql<Date>`${from}`)
      .where("transaction_date", "<=", sql<Date>`${to}`)
      .executeTakeFirstOrThrow(),
  ]);

  const spentByCategory = new Map<number, string>();
  for (const row of spentRows) {
    if (row.category_id !== null) {
      spentByCategory.set(row.category_id, row.total ?? "0");
    }
  }

  return budgets.map((b) => {
    const spentRaw =
      b.category_id === null
        ? totalSpentRow.total
        : (spentByCategory.get(b.category_id) ?? "0");
    const spent = dec(spentRaw ?? 0);
    const amount = dec(b.amount);
    const remaining = amount.minus(spent);
    const percentage = amount.gt(0)
      ? Math.min(999, Math.round(spent.div(amount).times(100).toNumber()))
      : 0;
    return {
      id: b.id,
      category_id: b.category_id,
      category_name: b.category_name,
      category_color: b.category_color,
      category_icon: b.category_icon,
      amount: amount.toFixed(4),
      currency: b.currency,
      period_month: b.period_month,
      spent: spent.toFixed(4),
      remaining: remaining.toFixed(4),
      percentage,
      is_over: spent.gt(amount),
    };
  });
}

export async function createBudget(
  user: SessionUser,
  input: BudgetCreateInput
): Promise<void> {
  if (input.category_id) {
    const category = await db
      .selectFrom("categories")
      .select(["id", "type"])
      .where("user_id", "=", user.id)
      .where("id", "=", input.category_id)
      .executeTakeFirst();
    if (!category) throw notFound("Kategori tidak ditemukan");
    if (category.type !== "expense") {
      throw new ApiError(
        422,
        "Budget hanya untuk kategori pengeluaran",
        "BUDGET_EXPENSE_ONLY"
      );
    }
  }

  // Unique key MySQL tidak menahan duplikat saat category_id NULL — cek manual
  let dupQuery = db
    .selectFrom("budgets")
    .select("id")
    .where("user_id", "=", user.id)
    .where("period_month", "=", input.period_month);
  dupQuery =
    input.category_id == null
      ? dupQuery.where("category_id", "is", null)
      : dupQuery.where("category_id", "=", input.category_id);
  const existing = await dupQuery.executeTakeFirst();
  if (existing) {
    throw new ApiError(
      409,
      "Budget untuk kategori & bulan ini sudah ada",
      "BUDGET_EXISTS"
    );
  }

  await db
    .insertInto("budgets")
    .values({
      user_id: user.id,
      category_id: input.category_id ?? null,
      amount: toDbMoney(input.amount),
      currency: user.base_currency,
      period_month: input.period_month,
    })
    .execute();
}

export async function updateBudget(
  userId: number,
  budgetId: number,
  input: BudgetUpdateInput
): Promise<void> {
  const existing = await db
    .selectFrom("budgets")
    .select("id")
    .where("user_id", "=", userId)
    .where("id", "=", budgetId)
    .executeTakeFirst();
  if (!existing) throw notFound("Budget tidak ditemukan");

  await db
    .updateTable("budgets")
    .set({ amount: toDbMoney(input.amount) })
    .where("user_id", "=", userId)
    .where("id", "=", budgetId)
    .execute();
}

export async function deleteBudget(
  userId: number,
  budgetId: number
): Promise<void> {
  const existing = await db
    .selectFrom("budgets")
    .select("id")
    .where("user_id", "=", userId)
    .where("id", "=", budgetId)
    .executeTakeFirst();
  if (!existing) throw notFound("Budget tidak ditemukan");

  await db
    .deleteFrom("budgets")
    .where("user_id", "=", userId)
    .where("id", "=", budgetId)
    .execute();
}
