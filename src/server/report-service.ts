import { sql } from "kysely";
import { db } from "@/db/client";
import { dec } from "@/lib/money";
import { listWallets } from "@/server/wallet-service";
import { findConversionRate } from "@/server/rate-service";
import type { SessionUser } from "@/lib/auth";
import type { CategoryType, TransactionType } from "@/db/schema-types";

export interface MonthlySummary {
  month: string;
  base_currency: string;
  totals: { income: string; expense: string; net: string };
  daily: Array<{ date: string; income: string; expense: string }>;
  by_category: Array<{
    category_id: number | null;
    name: string | null;
    color: string | null;
    icon: string | null;
    type: CategoryType;
    total: string;
  }>;
  wallets: Array<{
    id: number;
    name: string;
    currency: string;
    color: string | null;
    balance: string;
    balance_base: string | null;
  }>;
  total_balance_base: string;
  unconverted_currencies: string[];
}

function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(last).padStart(2, "0")}`,
  };
}

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Ringkasan bulanan dalam base currency user (PRD Bagian 8, /api/reports/summary). */
export async function getMonthlySummary(
  user: SessionUser,
  month: string
): Promise<MonthlySummary> {
  const { from, to } = monthRange(month);
  const baseAmount = sql<string>`SUM(amount * fx_rate_to_base)`;

  const [totals, daily, byCategory, wallets] = await Promise.all([
    db
      .selectFrom("transactions")
      .select(["type", baseAmount.as("total")])
      .where("user_id", "=", user.id)
      .where("transaction_date", ">=", sql<Date>`${from}`)
      .where("transaction_date", "<=", sql<Date>`${to}`)
      .groupBy("type")
      .execute(),
    db
      .selectFrom("transactions")
      .select([
        "transaction_date",
        "type",
        baseAmount.as("total"),
      ])
      .where("user_id", "=", user.id)
      .where("transaction_date", ">=", sql<Date>`${from}`)
      .where("transaction_date", "<=", sql<Date>`${to}`)
      .groupBy("transaction_date")
      .groupBy("type")
      .orderBy("transaction_date")
      .execute(),
    db
      .selectFrom("transactions")
      .leftJoin("categories", "categories.id", "transactions.category_id")
      .select([
        "transactions.category_id",
        "categories.name",
        "categories.color",
        "categories.icon",
        "transactions.type",
        sql<string>`SUM(transactions.amount * transactions.fx_rate_to_base)`.as(
          "total"
        ),
      ])
      .where("transactions.user_id", "=", user.id)
      .where("transactions.transaction_date", ">=", sql<Date>`${from}`)
      .where("transactions.transaction_date", "<=", sql<Date>`${to}`)
      .groupBy("transactions.category_id")
      .groupBy("categories.name")
      .groupBy("categories.color")
      .groupBy("categories.icon")
      .groupBy("transactions.type")
      .orderBy(sql`total`, "desc")
      .execute(),
    listWallets(user.id),
  ]);

  const incomeTotal =
    totals.find((t) => t.type === "income")?.total ?? "0";
  const expenseTotal =
    totals.find((t) => t.type === "expense")?.total ?? "0";

  // Cashflow harian → gabung income/expense per tanggal
  const dailyMap = new Map<string, { income: string; expense: string }>();
  for (const row of daily) {
    const date = toDateString(row.transaction_date);
    const entry = dailyMap.get(date) ?? { income: "0", expense: "0" };
    if (row.type === "income") entry.income = row.total ?? "0";
    else entry.expense = row.total ?? "0";
    dailyMap.set(date, entry);
  }

  // Saldo wallet → konversi ke base pakai kurs tersimpan
  const unconverted = new Set<string>();
  let totalBase = dec(0);
  const walletRows: MonthlySummary["wallets"] = [];
  for (const w of wallets) {
    let balanceBase: string | null = null;
    const rate = await findConversionRate(user.id, w.currency, user.base_currency);
    if (rate !== null) {
      const converted = dec(w.balance).times(dec(rate));
      balanceBase = converted.toFixed(4);
      totalBase = totalBase.plus(converted);
    } else {
      unconverted.add(w.currency);
    }
    walletRows.push({
      id: w.id,
      name: w.name,
      currency: w.currency,
      color: w.color,
      balance: w.balance,
      balance_base: balanceBase,
    });
  }

  return {
    month,
    base_currency: user.base_currency,
    totals: {
      income: dec(incomeTotal).toFixed(4),
      expense: dec(expenseTotal).toFixed(4),
      net: dec(incomeTotal).minus(dec(expenseTotal)).toFixed(4),
    },
    daily: [...dailyMap.entries()].map(([date, v]) => ({
      date,
      income: dec(v.income).toFixed(4),
      expense: dec(v.expense).toFixed(4),
    })),
    by_category: byCategory.map((row) => ({
      category_id: row.category_id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      type: row.type as TransactionType,
      total: dec(row.total ?? 0).toFixed(4),
    })),
    wallets: walletRows,
    total_balance_base: totalBase.toFixed(4),
    unconverted_currencies: [...unconverted],
  };
}
