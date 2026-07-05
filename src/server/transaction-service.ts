import { sql } from "kysely";
import { db } from "@/db/client";
import { ApiError, notFound } from "@/lib/api";
import { toDbMoney, toDbRate } from "@/lib/money";
import { findConversionRate } from "@/server/rate-service";
import type {
  TransactionCreateInput,
  TransactionListQuery,
  TransactionUpdateInput,
} from "@/lib/validators/transaction";
import type { SessionUser } from "@/lib/auth";
import type { TransactionType } from "@/db/schema-types";

export interface TransactionRow {
  id: number;
  wallet_id: number;
  wallet_name: string;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  type: TransactionType;
  amount: string;
  currency: string;
  fx_rate_to_base: string;
  note: string | null;
  transaction_date: string; // YYYY-MM-DD
}

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function assertOwnWallet(userId: number, walletId: number) {
  const wallet = await db
    .selectFrom("wallets")
    .select(["id", "currency"])
    .where("user_id", "=", userId)
    .where("id", "=", walletId)
    .executeTakeFirst();
  if (!wallet) throw notFound("Dompet tidak ditemukan");
  return wallet;
}

async function assertOwnCategoryOfType(
  userId: number,
  categoryId: number,
  type: TransactionType
) {
  const category = await db
    .selectFrom("categories")
    .select(["id", "type"])
    .where("user_id", "=", userId)
    .where("id", "=", categoryId)
    .executeTakeFirst();
  if (!category) throw notFound("Kategori tidak ditemukan");
  if (category.type !== type) {
    throw new ApiError(
      422,
      "Tipe kategori tidak cocok dengan tipe transaksi",
      "CATEGORY_TYPE_MISMATCH"
    );
  }
}

const baseSelect = () =>
  db
    .selectFrom("transactions")
    .innerJoin("wallets", "wallets.id", "transactions.wallet_id")
    .leftJoin("categories", "categories.id", "transactions.category_id")
    .select([
      "transactions.id",
      "transactions.wallet_id",
      "wallets.name as wallet_name",
      "transactions.category_id",
      "categories.name as category_name",
      "categories.color as category_color",
      "categories.icon as category_icon",
      "transactions.type",
      "transactions.amount",
      "transactions.currency",
      "transactions.fx_rate_to_base",
      "transactions.note",
      "transactions.transaction_date",
    ]);

function mapRow(row: {
  id: number;
  wallet_id: number;
  wallet_name: string;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  type: TransactionType;
  amount: string;
  currency: string;
  fx_rate_to_base: string;
  note: string | null;
  transaction_date: Date;
}): TransactionRow {
  return { ...row, transaction_date: toDateString(row.transaction_date) };
}

export async function getTransaction(
  userId: number,
  id: number
): Promise<TransactionRow> {
  const row = await baseSelect()
    .where("transactions.user_id", "=", userId)
    .where("transactions.id", "=", id)
    .executeTakeFirst();
  if (!row) throw notFound("Transaksi tidak ditemukan");
  return mapRow(row);
}

export interface TransactionListResult {
  transactions: TransactionRow[];
  total: number;
  page: number;
  per_page: number;
}

export async function listTransactions(
  userId: number,
  query: TransactionListQuery
): Promise<TransactionListResult> {
  let listQuery = baseSelect().where("transactions.user_id", "=", userId);
  let countQuery = db
    .selectFrom("transactions")
    .select((eb) => eb.fn.countAll().as("total"))
    .where("user_id", "=", userId);

  if (query.from) {
    listQuery = listQuery.where(
      "transactions.transaction_date",
      ">=",
      sql<Date>`${query.from}`
    );
    countQuery = countQuery.where(
      "transaction_date",
      ">=",
      sql<Date>`${query.from}`
    );
  }
  if (query.to) {
    listQuery = listQuery.where(
      "transactions.transaction_date",
      "<=",
      sql<Date>`${query.to}`
    );
    countQuery = countQuery.where(
      "transaction_date",
      "<=",
      sql<Date>`${query.to}`
    );
  }
  if (query.wallet_id) {
    listQuery = listQuery.where(
      "transactions.wallet_id",
      "=",
      query.wallet_id
    );
    countQuery = countQuery.where("wallet_id", "=", query.wallet_id);
  }
  if (query.category_id) {
    listQuery = listQuery.where(
      "transactions.category_id",
      "=",
      query.category_id
    );
    countQuery = countQuery.where("category_id", "=", query.category_id);
  }
  if (query.type) {
    listQuery = listQuery.where("transactions.type", "=", query.type);
    countQuery = countQuery.where("type", "=", query.type);
  }
  if (query.q) {
    listQuery = listQuery.where(
      "transactions.note",
      "like",
      `%${query.q}%`
    );
    countQuery = countQuery.where("note", "like", `%${query.q}%`);
  }

  const [rows, count] = await Promise.all([
    listQuery
      .orderBy("transactions.transaction_date", "desc")
      .orderBy("transactions.id", "desc")
      .limit(query.per_page)
      .offset((query.page - 1) * query.per_page)
      .execute(),
    countQuery.executeTakeFirstOrThrow(),
  ]);

  return {
    transactions: rows.map(mapRow),
    total: Number(count.total),
    page: query.page,
    per_page: query.per_page,
  };
}

export async function createTransaction(
  user: SessionUser,
  input: TransactionCreateInput
): Promise<TransactionRow> {
  const wallet = await assertOwnWallet(user.id, input.wallet_id);
  if (input.category_id) {
    await assertOwnCategoryOfType(user.id, input.category_id, input.type);
  }

  // fx_rate_to_base: eksplisit dari input, atau kurs tersimpan, atau 1
  let fxRate = input.fx_rate_to_base;
  if (!fxRate) {
    fxRate =
      (await findConversionRate(user.id, wallet.currency, user.base_currency)) ??
      "1";
  }

  const result = await db
    .insertInto("transactions")
    .values({
      user_id: user.id,
      wallet_id: input.wallet_id,
      category_id: input.category_id ?? null,
      type: input.type,
      amount: toDbMoney(input.amount),
      currency: wallet.currency,
      fx_rate_to_base: toDbRate(fxRate),
      note: input.note ?? null,
      transaction_date: input.transaction_date,
    })
    .executeTakeFirstOrThrow();

  return getTransaction(user.id, Number(result.insertId));
}

export async function updateTransaction(
  user: SessionUser,
  id: number,
  input: TransactionUpdateInput
): Promise<TransactionRow> {
  const existing = await getTransaction(user.id, id);

  const nextType = input.type ?? existing.type;
  const updates: Record<string, unknown> = {};

  if (input.wallet_id !== undefined && input.wallet_id !== existing.wallet_id) {
    const wallet = await assertOwnWallet(user.id, input.wallet_id);
    updates.wallet_id = input.wallet_id;
    updates.currency = wallet.currency;
    // Dompet berubah → currency bisa berubah → kurs lama tidak valid lagi
    if (input.fx_rate_to_base === undefined) {
      updates.fx_rate_to_base = toDbRate(
        (await findConversionRate(
          user.id,
          wallet.currency,
          user.base_currency
        )) ?? "1"
      );
    }
  }
  if (input.category_id !== undefined) {
    if (input.category_id !== null) {
      await assertOwnCategoryOfType(user.id, input.category_id, nextType);
    }
    updates.category_id = input.category_id;
  } else if (input.type && input.type !== existing.type) {
    // Tipe berubah tapi kategori tidak — kategori lama pasti salah tipe
    updates.category_id = null;
  }
  if (input.type !== undefined) updates.type = input.type;
  if (input.amount !== undefined) updates.amount = toDbMoney(input.amount);
  if (input.fx_rate_to_base !== undefined)
    updates.fx_rate_to_base = toDbRate(input.fx_rate_to_base);
  if (input.note !== undefined) updates.note = input.note;
  if (input.transaction_date !== undefined)
    updates.transaction_date = input.transaction_date;

  if (Object.keys(updates).length > 0) {
    await db
      .updateTable("transactions")
      .set(updates)
      .where("user_id", "=", user.id)
      .where("id", "=", id)
      .execute();
  }
  return getTransaction(user.id, id);
}

export async function deleteTransaction(
  userId: number,
  id: number
): Promise<void> {
  await getTransaction(userId, id); // cek kepemilikan
  await db
    .deleteFrom("transactions")
    .where("user_id", "=", userId)
    .where("id", "=", id)
    .execute();
}
