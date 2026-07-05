import { sql } from "kysely";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";
import { db } from "@/db/client";
import { ApiError, notFound } from "@/lib/api";
import { toDbMoney, toDbRate } from "@/lib/money";
import { findConversionRate } from "@/server/rate-service";
import type {
  RecurringCreateInput,
  RecurringUpdateInput,
} from "@/lib/validators/recurring";
import type { SessionUser } from "@/lib/auth";
import type { RecurringFrequency, TransactionType } from "@/db/schema-types";

export interface RecurringRow {
  id: number;
  wallet_id: number;
  wallet_name: string;
  category_id: number | null;
  category_name: string | null;
  type: TransactionType;
  amount: string;
  currency: string;
  frequency: RecurringFrequency;
  interval_count: number;
  next_run_date: string;
  end_date: string | null;
  note: string | null;
  is_active: boolean;
}

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Jadwal berikutnya setelah `dateStr` sesuai frekuensi × interval.
 * Monthly/yearly memakai date-fns (31 Jan + 1 bln → 28/29 Feb, tidak overflow).
 */
export function advanceRunDate(
  dateStr: string,
  frequency: RecurringFrequency,
  intervalCount: number
): string {
  const date = new Date(`${dateStr}T00:00:00`);
  switch (frequency) {
    case "daily":
      return toDateString(addDays(date, intervalCount));
    case "weekly":
      return toDateString(addWeeks(date, intervalCount));
    case "monthly":
      return toDateString(addMonths(date, intervalCount));
    case "yearly":
      return toDateString(addYears(date, intervalCount));
  }
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
    .selectFrom("recurring_transactions")
    .innerJoin("wallets", "wallets.id", "recurring_transactions.wallet_id")
    .leftJoin(
      "categories",
      "categories.id",
      "recurring_transactions.category_id"
    )
    .select([
      "recurring_transactions.id",
      "recurring_transactions.wallet_id",
      "wallets.name as wallet_name",
      "recurring_transactions.category_id",
      "categories.name as category_name",
      "recurring_transactions.type",
      "recurring_transactions.amount",
      "recurring_transactions.currency",
      "recurring_transactions.frequency",
      "recurring_transactions.interval_count",
      "recurring_transactions.next_run_date",
      "recurring_transactions.end_date",
      "recurring_transactions.note",
      "recurring_transactions.is_active",
    ]);

function mapRow(row: {
  id: number;
  wallet_id: number;
  wallet_name: string;
  category_id: number | null;
  category_name: string | null;
  type: TransactionType;
  amount: string;
  currency: string;
  frequency: RecurringFrequency;
  interval_count: number;
  next_run_date: Date;
  end_date: Date | null;
  note: string | null;
  is_active: number;
}): RecurringRow {
  return {
    ...row,
    next_run_date: toDateString(row.next_run_date),
    end_date: row.end_date ? toDateString(row.end_date) : null,
    is_active: row.is_active === 1,
  };
}

export async function listRecurrings(userId: number): Promise<RecurringRow[]> {
  const rows = await baseSelect()
    .where("recurring_transactions.user_id", "=", userId)
    .orderBy("recurring_transactions.is_active", "desc")
    .orderBy("recurring_transactions.next_run_date")
    .orderBy("recurring_transactions.id")
    .execute();
  return rows.map(mapRow);
}

export async function getRecurring(
  userId: number,
  id: number
): Promise<RecurringRow> {
  const row = await baseSelect()
    .where("recurring_transactions.user_id", "=", userId)
    .where("recurring_transactions.id", "=", id)
    .executeTakeFirst();
  if (!row) throw notFound("Transaksi berulang tidak ditemukan");
  return mapRow(row);
}

export async function createRecurring(
  user: SessionUser,
  input: RecurringCreateInput
): Promise<RecurringRow> {
  const wallet = await assertOwnWallet(user.id, input.wallet_id);
  if (input.category_id) {
    await assertOwnCategoryOfType(user.id, input.category_id, input.type);
  }
  if (input.end_date && input.end_date < input.next_run_date) {
    throw new ApiError(
      422,
      "Tanggal berakhir tidak boleh sebelum jadwal berikutnya",
      "END_BEFORE_START"
    );
  }

  const result = await db
    .insertInto("recurring_transactions")
    .values({
      user_id: user.id,
      wallet_id: input.wallet_id,
      category_id: input.category_id ?? null,
      type: input.type,
      amount: toDbMoney(input.amount),
      currency: wallet.currency,
      frequency: input.frequency,
      interval_count: input.interval_count,
      next_run_date: input.next_run_date,
      end_date: input.end_date ?? null,
      note: input.note ?? null,
    })
    .executeTakeFirstOrThrow();

  return getRecurring(user.id, Number(result.insertId));
}

export async function updateRecurring(
  user: SessionUser,
  id: number,
  input: RecurringUpdateInput
): Promise<RecurringRow> {
  const existing = await getRecurring(user.id, id);

  const nextType = input.type ?? existing.type;
  const updates: Record<string, unknown> = {};

  if (input.wallet_id !== undefined && input.wallet_id !== existing.wallet_id) {
    const wallet = await assertOwnWallet(user.id, input.wallet_id);
    updates.wallet_id = input.wallet_id;
    updates.currency = wallet.currency;
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
  if (input.frequency !== undefined) updates.frequency = input.frequency;
  if (input.interval_count !== undefined)
    updates.interval_count = input.interval_count;
  if (input.next_run_date !== undefined)
    updates.next_run_date = input.next_run_date;
  if (input.end_date !== undefined) updates.end_date = input.end_date;
  if (input.note !== undefined) updates.note = input.note;
  if (input.is_active !== undefined)
    updates.is_active = input.is_active ? 1 : 0;

  const nextRun = input.next_run_date ?? existing.next_run_date;
  const endDate =
    input.end_date === undefined ? existing.end_date : input.end_date;
  if (endDate && endDate < nextRun) {
    throw new ApiError(
      422,
      "Tanggal berakhir tidak boleh sebelum jadwal berikutnya",
      "END_BEFORE_START"
    );
  }

  if (Object.keys(updates).length > 0) {
    await db
      .updateTable("recurring_transactions")
      .set(updates)
      .where("user_id", "=", user.id)
      .where("id", "=", id)
      .execute();
  }
  return getRecurring(user.id, id);
}

export async function deleteRecurring(
  userId: number,
  id: number
): Promise<void> {
  await getRecurring(userId, id);
  await db
    .deleteFrom("recurring_transactions")
    .where("user_id", "=", userId)
    .where("id", "=", id)
    .execute();
}

export interface RunResult {
  processed: number;
  transactions_created: number;
  deactivated: number;
}

/**
 * Eksekusi semua recurring jatuh tempo (next_run_date <= hari ini):
 * buat transaksi aktual per kejadian (catch-up bila terlewat beberapa periode),
 * majukan next_run_date, nonaktifkan yang melewati end_date.
 * Idempotent: setelah dijalankan, next_run_date > hari ini sehingga
 * pemanggilan ulang di hari yang sama tidak membuat transaksi ganda.
 */
export async function runDueRecurrings(userId?: number): Promise<RunResult> {
  const today = toDateString(new Date());

  let query = db
    .selectFrom("recurring_transactions")
    .innerJoin("users", "users.id", "recurring_transactions.user_id")
    .select([
      "recurring_transactions.id",
      "recurring_transactions.user_id",
      "recurring_transactions.wallet_id",
      "recurring_transactions.category_id",
      "recurring_transactions.type",
      "recurring_transactions.amount",
      "recurring_transactions.currency",
      "recurring_transactions.frequency",
      "recurring_transactions.interval_count",
      "recurring_transactions.next_run_date",
      "recurring_transactions.end_date",
      "recurring_transactions.note",
      "users.base_currency",
    ])
    .where("recurring_transactions.is_active", "=", 1)
    .where("recurring_transactions.next_run_date", "<=", sql<Date>`${today}`);
  if (userId) query = query.where("recurring_transactions.user_id", "=", userId);

  const due = await query.execute();

  const result: RunResult = {
    processed: 0,
    transactions_created: 0,
    deactivated: 0,
  };

  for (const item of due) {
    const endDate = item.end_date ? toDateString(item.end_date) : null;
    const fxRate =
      (await findConversionRate(
        item.user_id,
        item.currency,
        item.base_currency
      )) ?? "1";

    let nextRun = toDateString(item.next_run_date);
    const occurrences: string[] = [];
    while (nextRun <= today && (!endDate || nextRun <= endDate)) {
      occurrences.push(nextRun);
      nextRun = advanceRunDate(nextRun, item.frequency, item.interval_count);
    }
    const shouldDeactivate = endDate !== null && nextRun > endDate;

    await db.transaction().execute(async (trx) => {
      if (occurrences.length > 0) {
        await trx
          .insertInto("transactions")
          .values(
            occurrences.map((date) => ({
              user_id: item.user_id,
              wallet_id: item.wallet_id,
              category_id: item.category_id,
              type: item.type,
              amount: item.amount,
              currency: item.currency,
              fx_rate_to_base: toDbRate(fxRate),
              note: item.note ?? null,
              transaction_date: date,
            }))
          )
          .execute();
      }
      await trx
        .updateTable("recurring_transactions")
        .set({
          next_run_date: nextRun,
          ...(shouldDeactivate ? { is_active: 0 } : {}),
        })
        .where("id", "=", item.id)
        .execute();
    });

    result.processed += 1;
    result.transactions_created += occurrences.length;
    if (shouldDeactivate) result.deactivated += 1;
  }

  return result;
}
