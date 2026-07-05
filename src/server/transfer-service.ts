import { sql } from "kysely";
import { db } from "@/db/client";
import { notFound } from "@/lib/api";
import { toDbMoney } from "@/lib/money";
import type { TransferCreateInput } from "@/lib/validators/wallet";

export interface TransferRow {
  id: number;
  from_wallet_id: number;
  from_wallet_name: string;
  from_currency: string;
  to_wallet_id: number;
  to_wallet_name: string;
  to_currency: string;
  from_amount: string;
  to_amount: string;
  fee: string;
  note: string | null;
  transfer_date: string; // YYYY-MM-DD
}

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const baseSelect = () =>
  db
    .selectFrom("transfers")
    .innerJoin("wallets as wf", "wf.id", "transfers.from_wallet_id")
    .innerJoin("wallets as wt", "wt.id", "transfers.to_wallet_id")
    .select([
      "transfers.id",
      "transfers.from_wallet_id",
      "wf.name as from_wallet_name",
      "wf.currency as from_currency",
      "transfers.to_wallet_id",
      "wt.name as to_wallet_name",
      "wt.currency as to_currency",
      "transfers.from_amount",
      "transfers.to_amount",
      "transfers.fee",
      "transfers.note",
      "transfers.transfer_date",
    ]);

export async function listTransfers(
  userId: number,
  opts?: { from?: string; to?: string; page?: number; per_page?: number }
): Promise<{ transfers: TransferRow[]; total: number }> {
  const page = opts?.page ?? 1;
  const perPage = opts?.per_page ?? 20;

  let listQuery = baseSelect().where("transfers.user_id", "=", userId);
  let countQuery = db
    .selectFrom("transfers")
    .select((eb) => eb.fn.countAll().as("total"))
    .where("user_id", "=", userId);

  if (opts?.from) {
    listQuery = listQuery.where(
      "transfers.transfer_date",
      ">=",
      sql<Date>`${opts.from}`
    );
    countQuery = countQuery.where(
      "transfer_date",
      ">=",
      sql<Date>`${opts.from}`
    );
  }
  if (opts?.to) {
    listQuery = listQuery.where(
      "transfers.transfer_date",
      "<=",
      sql<Date>`${opts.to}`
    );
    countQuery = countQuery.where(
      "transfer_date",
      "<=",
      sql<Date>`${opts.to}`
    );
  }

  const [rows, count] = await Promise.all([
    listQuery
      .orderBy("transfers.transfer_date", "desc")
      .orderBy("transfers.id", "desc")
      .limit(perPage)
      .offset((page - 1) * perPage)
      .execute(),
    countQuery.executeTakeFirstOrThrow(),
  ]);

  return {
    transfers: rows.map((r) => ({
      ...r,
      transfer_date: toDateString(r.transfer_date),
    })),
    total: Number(count.total),
  };
}

export async function createTransfer(
  userId: number,
  input: TransferCreateInput
): Promise<TransferRow> {
  // Kedua dompet harus milik user
  const wallets = await db
    .selectFrom("wallets")
    .select(["id"])
    .where("user_id", "=", userId)
    .where("id", "in", [input.from_wallet_id, input.to_wallet_id])
    .execute();
  if (wallets.length !== 2) throw notFound("Dompet tidak ditemukan");

  const result = await db.transaction().execute(async (trx) => {
    return trx
      .insertInto("transfers")
      .values({
        user_id: userId,
        from_wallet_id: input.from_wallet_id,
        to_wallet_id: input.to_wallet_id,
        from_amount: toDbMoney(input.from_amount),
        to_amount: toDbMoney(input.to_amount),
        fee: toDbMoney(input.fee),
        note: input.note ?? null,
        transfer_date: input.transfer_date,
      })
      .executeTakeFirstOrThrow();
  });

  const row = await baseSelect()
    .where("transfers.user_id", "=", userId)
    .where("transfers.id", "=", Number(result.insertId))
    .executeTakeFirstOrThrow();
  return { ...row, transfer_date: toDateString(row.transfer_date) };
}

export async function deleteTransfer(
  userId: number,
  id: number
): Promise<void> {
  const existing = await db
    .selectFrom("transfers")
    .select("id")
    .where("user_id", "=", userId)
    .where("id", "=", id)
    .executeTakeFirst();
  if (!existing) throw notFound("Transfer tidak ditemukan");
  await db
    .deleteFrom("transfers")
    .where("user_id", "=", userId)
    .where("id", "=", id)
    .execute();
}
