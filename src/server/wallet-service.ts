import { sql } from "kysely";
import Decimal from "decimal.js";
import { db } from "@/db/client";
import { ApiError, notFound } from "@/lib/api";
import { dec, toDbMoney } from "@/lib/money";
import type {
  WalletCreateInput,
  WalletUpdateInput,
} from "@/lib/validators/wallet";
import type { WalletType } from "@/db/schema-types";

export interface WalletWithBalance {
  id: number;
  name: string;
  type: WalletType;
  currency: string;
  initial_balance: string;
  color: string | null;
  icon: string | null;
  is_archived: number;
  balance: string;
}

/**
 * Saldo wallet = initial_balance
 *   + Σ transaksi income − Σ transaksi expense
 *   + Σ transfer masuk (to_amount) − Σ transfer keluar (from_amount + fee)
 * Dihitung on-the-fly (PRD Bagian 5), agregasi via SQL SUM lalu Decimal.
 */
async function balanceComponents(
  userId: number,
  walletIds: number[]
): Promise<Map<number, Decimal>> {
  const result = new Map<number, Decimal>();
  if (walletIds.length === 0) return result;

  const [txSums, outSums, inSums] = await Promise.all([
    db
      .selectFrom("transactions")
      .select((eb) => [
        "wallet_id",
        eb.fn
          .sum(
            sql<string>`CASE WHEN type = 'income' THEN amount ELSE -amount END`
          )
          .as("total"),
      ])
      .where("user_id", "=", userId)
      .where("wallet_id", "in", walletIds)
      .groupBy("wallet_id")
      .execute(),
    db
      .selectFrom("transfers")
      .select((eb) => [
        "from_wallet_id as wallet_id",
        eb.fn.sum(sql<string>`from_amount + fee`).as("total"),
      ])
      .where("user_id", "=", userId)
      .where("from_wallet_id", "in", walletIds)
      .groupBy("from_wallet_id")
      .execute(),
    db
      .selectFrom("transfers")
      .select((eb) => [
        "to_wallet_id as wallet_id",
        eb.fn.sum("to_amount").as("total"),
      ])
      .where("user_id", "=", userId)
      .where("to_wallet_id", "in", walletIds)
      .groupBy("to_wallet_id")
      .execute(),
  ]);

  const add = (walletId: number, value: string | null, sign: 1 | -1) => {
    if (value === null) return;
    const current = result.get(walletId) ?? new Decimal(0);
    result.set(walletId, current.plus(dec(value).times(sign)));
  };

  for (const row of txSums) add(row.wallet_id, row.total as string | null, 1);
  for (const row of outSums) add(row.wallet_id, row.total as string | null, -1);
  for (const row of inSums) add(row.wallet_id, row.total as string | null, 1);
  return result;
}

export async function listWallets(
  userId: number,
  opts?: { includeArchived?: boolean }
): Promise<WalletWithBalance[]> {
  let query = db
    .selectFrom("wallets")
    .select([
      "id",
      "name",
      "type",
      "currency",
      "initial_balance",
      "color",
      "icon",
      "is_archived",
    ])
    .where("user_id", "=", userId)
    .orderBy("is_archived")
    .orderBy("created_at");
  if (!opts?.includeArchived) {
    query = query.where("is_archived", "=", 0);
  }
  const wallets = await query.execute();

  const deltas = await balanceComponents(
    userId,
    wallets.map((w) => w.id)
  );

  return wallets.map((w) => ({
    ...w,
    balance: dec(w.initial_balance)
      .plus(deltas.get(w.id) ?? 0)
      .toFixed(4),
  }));
}

export async function getWallet(
  userId: number,
  walletId: number
): Promise<WalletWithBalance> {
  const wallet = await db
    .selectFrom("wallets")
    .select([
      "id",
      "name",
      "type",
      "currency",
      "initial_balance",
      "color",
      "icon",
      "is_archived",
    ])
    .where("user_id", "=", userId)
    .where("id", "=", walletId)
    .executeTakeFirst();
  if (!wallet) throw notFound("Dompet tidak ditemukan");

  const deltas = await balanceComponents(userId, [wallet.id]);
  return {
    ...wallet,
    balance: dec(wallet.initial_balance)
      .plus(deltas.get(wallet.id) ?? 0)
      .toFixed(4),
  };
}

export async function createWallet(
  userId: number,
  input: WalletCreateInput
): Promise<WalletWithBalance> {
  const currency = await db
    .selectFrom("currencies")
    .select("code")
    .where("code", "=", input.currency)
    .executeTakeFirst();
  if (!currency) {
    throw new ApiError(422, "Mata uang tidak dikenal", "INVALID_CURRENCY");
  }

  const result = await db
    .insertInto("wallets")
    .values({
      user_id: userId,
      name: input.name,
      type: input.type,
      currency: input.currency,
      initial_balance: toDbMoney(input.initial_balance),
      color: input.color ?? null,
      icon: input.icon ?? null,
    })
    .executeTakeFirstOrThrow();

  return getWallet(userId, Number(result.insertId));
}

export async function updateWallet(
  userId: number,
  walletId: number,
  input: WalletUpdateInput
): Promise<WalletWithBalance> {
  await getWallet(userId, walletId); // cek kepemilikan

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.type !== undefined) updates.type = input.type;
  if (input.initial_balance !== undefined)
    updates.initial_balance = toDbMoney(input.initial_balance);
  if (input.color !== undefined) updates.color = input.color;
  if (input.icon !== undefined) updates.icon = input.icon;
  if (input.is_archived !== undefined)
    updates.is_archived = input.is_archived ? 1 : 0;

  if (Object.keys(updates).length > 0) {
    await db
      .updateTable("wallets")
      .set(updates)
      .where("user_id", "=", userId)
      .where("id", "=", walletId)
      .execute();
  }
  return getWallet(userId, walletId);
}

export async function deleteWallet(
  userId: number,
  walletId: number
): Promise<void> {
  await getWallet(userId, walletId); // cek kepemilikan

  // Cegah hapus tak sengaja: dompet yang masih dipakai transfer/transaksi
  const [txCount, trCount] = await Promise.all([
    db
      .selectFrom("transactions")
      .select((eb) => eb.fn.countAll().as("n"))
      .where("wallet_id", "=", walletId)
      .executeTakeFirstOrThrow(),
    db
      .selectFrom("transfers")
      .select((eb) => eb.fn.countAll().as("n"))
      .where((eb) =>
        eb.or([
          eb("from_wallet_id", "=", walletId),
          eb("to_wallet_id", "=", walletId),
        ])
      )
      .executeTakeFirstOrThrow(),
  ]);

  if (Number(txCount.n) > 0 || Number(trCount.n) > 0) {
    throw new ApiError(
      409,
      "Dompet masih punya transaksi/transfer. Arsipkan saja, atau hapus transaksinya dulu.",
      "WALLET_IN_USE"
    );
  }

  await db
    .deleteFrom("wallets")
    .where("user_id", "=", userId)
    .where("id", "=", walletId)
    .execute();
}
