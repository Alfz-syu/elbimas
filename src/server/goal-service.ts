import { db } from "@/db/client";
import { ApiError, notFound } from "@/lib/api";
import { dec, toDbMoney } from "@/lib/money";
import type {
  GoalContributeInput,
  GoalCreateInput,
  GoalUpdateInput,
} from "@/lib/validators/goal";
import type { SessionUser } from "@/lib/auth";

export interface GoalRow {
  id: number;
  name: string;
  target_amount: string;
  current_amount: string;
  currency: string;
  wallet_id: number | null;
  wallet_name: string | null;
  target_date: string | null;
  is_achieved: number;
  percentage: number;
}

function toDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const baseSelect = () =>
  db
    .selectFrom("savings_goals")
    .leftJoin("wallets", "wallets.id", "savings_goals.wallet_id")
    .select([
      "savings_goals.id",
      "savings_goals.name",
      "savings_goals.target_amount",
      "savings_goals.current_amount",
      "savings_goals.currency",
      "savings_goals.wallet_id",
      "wallets.name as wallet_name",
      "savings_goals.target_date",
      "savings_goals.is_achieved",
    ]);

function mapRow(row: {
  id: number;
  name: string;
  target_amount: string;
  current_amount: string;
  currency: string;
  wallet_id: number | null;
  wallet_name: string | null;
  target_date: Date | null;
  is_achieved: number;
}): GoalRow {
  const target = dec(row.target_amount);
  const current = dec(row.current_amount);
  return {
    ...row,
    target_date: row.target_date ? toDateString(row.target_date) : null,
    percentage: target.gt(0)
      ? Math.min(100, Math.floor(current.div(target).times(100).toNumber()))
      : 0,
  };
}

export async function listGoals(userId: number): Promise<GoalRow[]> {
  const rows = await baseSelect()
    .where("savings_goals.user_id", "=", userId)
    .orderBy("savings_goals.is_achieved")
    .orderBy("savings_goals.created_at", "desc")
    .execute();
  return rows.map(mapRow);
}

export async function getGoal(userId: number, goalId: number): Promise<GoalRow> {
  const row = await baseSelect()
    .where("savings_goals.user_id", "=", userId)
    .where("savings_goals.id", "=", goalId)
    .executeTakeFirst();
  if (!row) throw notFound("Target tabungan tidak ditemukan");
  return mapRow(row);
}

async function assertOwnWallet(userId: number, walletId: number) {
  const wallet = await db
    .selectFrom("wallets")
    .select("id")
    .where("user_id", "=", userId)
    .where("id", "=", walletId)
    .executeTakeFirst();
  if (!wallet) throw notFound("Dompet tidak ditemukan");
}

export async function createGoal(
  user: SessionUser,
  input: GoalCreateInput
): Promise<GoalRow> {
  if (input.wallet_id) await assertOwnWallet(user.id, input.wallet_id);

  const result = await db
    .insertInto("savings_goals")
    .values({
      user_id: user.id,
      name: input.name,
      target_amount: toDbMoney(input.target_amount),
      current_amount: "0.0000",
      currency: input.currency ?? user.base_currency,
      wallet_id: input.wallet_id ?? null,
      target_date: input.target_date ?? null,
    })
    .executeTakeFirstOrThrow();

  return getGoal(user.id, Number(result.insertId));
}

export async function updateGoal(
  userId: number,
  goalId: number,
  input: GoalUpdateInput
): Promise<GoalRow> {
  const goal = await getGoal(userId, goalId);
  if (input.wallet_id) await assertOwnWallet(userId, input.wallet_id);

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.target_amount !== undefined) {
    updates.target_amount = toDbMoney(input.target_amount);
    updates.is_achieved = dec(goal.current_amount).gte(
      dec(input.target_amount)
    )
      ? 1
      : 0;
  }
  if (input.wallet_id !== undefined) updates.wallet_id = input.wallet_id;
  if (input.target_date !== undefined) updates.target_date = input.target_date;

  if (Object.keys(updates).length > 0) {
    await db
      .updateTable("savings_goals")
      .set(updates)
      .where("user_id", "=", userId)
      .where("id", "=", goalId)
      .execute();
  }
  return getGoal(userId, goalId);
}

export async function deleteGoal(userId: number, goalId: number): Promise<void> {
  await getGoal(userId, goalId);
  await db
    .deleteFrom("savings_goals")
    .where("user_id", "=", userId)
    .where("id", "=", goalId)
    .execute();
}

/** Tambah kontribusi; tandai tercapai bila current >= target. */
export async function contributeToGoal(
  userId: number,
  goalId: number,
  input: GoalContributeInput
): Promise<GoalRow> {
  const goal = await getGoal(userId, goalId);
  if (goal.is_achieved) {
    throw new ApiError(
      422,
      "Target sudah tercapai",
      "GOAL_ALREADY_ACHIEVED"
    );
  }

  const next = dec(goal.current_amount).plus(dec(input.amount));
  const achieved = next.gte(dec(goal.target_amount));

  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable("savings_goals")
      .set({
        current_amount: next.toFixed(4),
        is_achieved: achieved ? 1 : 0,
      })
      .where("user_id", "=", userId)
      .where("id", "=", goalId)
      .execute();
  });

  return getGoal(userId, goalId);
}
