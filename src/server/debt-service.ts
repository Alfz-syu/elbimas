import { sql } from "kysely";
import Decimal from "decimal.js";
import { db } from "@/db/client";
import { ApiError, notFound } from "@/lib/api";
import { dec, toDbMoney } from "@/lib/money";
import type {
  DebtCreateInput,
  DebtPaymentInput,
  DebtUpdateInput,
} from "@/lib/validators/debt";
import type { SessionUser } from "@/lib/auth";
import type { DebtStatus, DebtType } from "@/db/schema-types";

export interface DebtRow {
  id: number;
  type: DebtType;
  counterparty: string;
  principal_amount: string;
  currency: string;
  due_date: string | null;
  status: DebtStatus;
  note: string | null;
  paid_total: string;
  remaining: string;
  percentage: number;
}

export interface DebtPaymentRow {
  id: number;
  amount: string;
  wallet_id: number | null;
  wallet_name: string | null;
  payment_date: string;
  note: string | null;
}

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Status utang dari Σ pembayaran vs pokok (dipakai juga oleh unit test). */
export function computeStatus(paid: Decimal, principal: Decimal): DebtStatus {
  if (paid.lte(0)) return "open";
  if (paid.gte(principal)) return "settled";
  return "partial";
}

function buildRow(
  debt: {
    id: number;
    type: DebtType;
    counterparty: string;
    principal_amount: string;
    currency: string;
    due_date: Date | null;
    status: DebtStatus;
    note: string | null;
  },
  paidTotal: string
): DebtRow {
  const principal = dec(debt.principal_amount);
  const paid = dec(paidTotal);
  return {
    id: debt.id,
    type: debt.type,
    counterparty: debt.counterparty,
    principal_amount: principal.toFixed(4),
    currency: debt.currency,
    due_date: debt.due_date ? toDateString(debt.due_date) : null,
    status: debt.status,
    note: debt.note,
    paid_total: paid.toFixed(4),
    remaining: Decimal.max(principal.minus(paid), 0).toFixed(4),
    percentage: principal.gt(0)
      ? Math.min(100, Math.floor(paid.div(principal).times(100).toNumber()))
      : 0,
  };
}

export async function listDebts(
  userId: number,
  type?: DebtType
): Promise<DebtRow[]> {
  let query = db
    .selectFrom("debts")
    .leftJoin("debt_payments", "debt_payments.debt_id", "debts.id")
    .select([
      "debts.id",
      "debts.type",
      "debts.counterparty",
      "debts.principal_amount",
      "debts.currency",
      "debts.due_date",
      "debts.status",
      "debts.note",
      sql<string>`COALESCE(SUM(debt_payments.amount), 0)`.as("paid_total"),
    ])
    .where("debts.user_id", "=", userId)
    .groupBy("debts.id")
    .orderBy(sql`debts.status = 'settled'`)
    .orderBy(sql`debts.due_date IS NULL`)
    .orderBy("debts.due_date")
    .orderBy("debts.created_at", "desc");
  if (type) query = query.where("debts.type", "=", type);

  const rows = await query.execute();
  return rows.map((r) => buildRow(r, r.paid_total ?? "0"));
}

export async function getDebt(
  userId: number,
  debtId: number
): Promise<DebtRow & { payments: DebtPaymentRow[] }> {
  const debt = await db
    .selectFrom("debts")
    .select([
      "id",
      "type",
      "counterparty",
      "principal_amount",
      "currency",
      "due_date",
      "status",
      "note",
    ])
    .where("user_id", "=", userId)
    .where("id", "=", debtId)
    .executeTakeFirst();
  if (!debt) throw notFound("Catatan utang/piutang tidak ditemukan");

  const payments = await db
    .selectFrom("debt_payments")
    .leftJoin("wallets", "wallets.id", "debt_payments.wallet_id")
    .select([
      "debt_payments.id",
      "debt_payments.amount",
      "debt_payments.wallet_id",
      "wallets.name as wallet_name",
      "debt_payments.payment_date",
      "debt_payments.note",
    ])
    .where("debt_payments.debt_id", "=", debtId)
    .where("debt_payments.user_id", "=", userId)
    .orderBy("debt_payments.payment_date", "desc")
    .orderBy("debt_payments.id", "desc")
    .execute();

  const paidTotal = payments.reduce(
    (acc, p) => acc.plus(dec(p.amount)),
    dec(0)
  );

  return {
    ...buildRow(debt, paidTotal.toFixed(4)),
    payments: payments.map((p) => ({
      id: p.id,
      amount: dec(p.amount).toFixed(4),
      wallet_id: p.wallet_id,
      wallet_name: p.wallet_name,
      payment_date: toDateString(p.payment_date),
      note: p.note,
    })),
  };
}

export async function createDebt(
  user: SessionUser,
  input: DebtCreateInput
): Promise<DebtRow> {
  const result = await db
    .insertInto("debts")
    .values({
      user_id: user.id,
      type: input.type,
      counterparty: input.counterparty,
      principal_amount: toDbMoney(input.principal_amount),
      currency: input.currency ?? user.base_currency,
      due_date: input.due_date ?? null,
      note: input.note ?? null,
    })
    .executeTakeFirstOrThrow();
  return getDebt(user.id, Number(result.insertId));
}

export async function updateDebt(
  userId: number,
  debtId: number,
  input: DebtUpdateInput
): Promise<DebtRow> {
  const existing = await getDebt(userId, debtId);

  const updates: Record<string, unknown> = {};
  if (input.counterparty !== undefined)
    updates.counterparty = input.counterparty;
  if (input.due_date !== undefined) updates.due_date = input.due_date;
  if (input.note !== undefined) updates.note = input.note;
  if (input.principal_amount !== undefined) {
    updates.principal_amount = toDbMoney(input.principal_amount);
    updates.status = computeStatus(
      dec(existing.paid_total),
      dec(input.principal_amount)
    );
  }

  if (Object.keys(updates).length > 0) {
    await db
      .updateTable("debts")
      .set(updates)
      .where("user_id", "=", userId)
      .where("id", "=", debtId)
      .execute();
  }
  return getDebt(userId, debtId);
}

export async function deleteDebt(userId: number, debtId: number): Promise<void> {
  await getDebt(userId, debtId);
  // debt_payments ikut terhapus via FK CASCADE
  await db
    .deleteFrom("debts")
    .where("user_id", "=", userId)
    .where("id", "=", debtId)
    .execute();
}

/** Catat pembayaran; status debt dihitung ulang otomatis (open/partial/settled). */
export async function addDebtPayment(
  userId: number,
  debtId: number,
  input: DebtPaymentInput
): Promise<DebtRow & { payments: DebtPaymentRow[] }> {
  const debt = await getDebt(userId, debtId);
  if (debt.status === "settled") {
    throw new ApiError(422, "Utang/piutang ini sudah lunas", "DEBT_SETTLED");
  }

  if (input.wallet_id) {
    const wallet = await db
      .selectFrom("wallets")
      .select("id")
      .where("user_id", "=", userId)
      .where("id", "=", input.wallet_id)
      .executeTakeFirst();
    if (!wallet) throw notFound("Dompet tidak ditemukan");
  }

  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto("debt_payments")
      .values({
        debt_id: debtId,
        user_id: userId,
        amount: toDbMoney(input.amount),
        wallet_id: input.wallet_id ?? null,
        payment_date: input.payment_date,
        note: input.note ?? null,
      })
      .execute();

    const newPaid = dec(debt.paid_total).plus(dec(input.amount));
    await trx
      .updateTable("debts")
      .set({ status: computeStatus(newPaid, dec(debt.principal_amount)) })
      .where("user_id", "=", userId)
      .where("id", "=", debtId)
      .execute();
  });

  return getDebt(userId, debtId);
}
