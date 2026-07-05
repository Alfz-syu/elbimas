import { db } from "@/db/client";
import { ApiError, notFound } from "@/lib/api";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
} from "@/lib/validators/category";
import type { CategoryType } from "@/db/schema-types";

export interface CategoryRow {
  id: number;
  name: string;
  type: CategoryType;
  parent_id: number | null;
  color: string | null;
  icon: string | null;
}

const CATEGORY_COLUMNS = [
  "id",
  "name",
  "type",
  "parent_id",
  "color",
  "icon",
] as const;

export async function listCategories(
  userId: number,
  type?: CategoryType
): Promise<CategoryRow[]> {
  let query = db
    .selectFrom("categories")
    .select(CATEGORY_COLUMNS)
    .where("user_id", "=", userId)
    .orderBy("type")
    .orderBy("name");
  if (type) query = query.where("type", "=", type);
  return query.execute();
}

async function assertOwnCategory(
  userId: number,
  categoryId: number
): Promise<CategoryRow> {
  const category = await db
    .selectFrom("categories")
    .select(CATEGORY_COLUMNS)
    .where("user_id", "=", userId)
    .where("id", "=", categoryId)
    .executeTakeFirst();
  if (!category) throw notFound("Kategori tidak ditemukan");
  return category;
}

export async function createCategory(
  userId: number,
  input: CategoryCreateInput
): Promise<CategoryRow> {
  if (input.parent_id) {
    const parent = await assertOwnCategory(userId, input.parent_id);
    if (parent.type !== input.type) {
      throw new ApiError(
        422,
        "Tipe kategori harus sama dengan tipe induknya",
        "PARENT_TYPE_MISMATCH"
      );
    }
  }

  const result = await db
    .insertInto("categories")
    .values({
      user_id: userId,
      name: input.name,
      type: input.type,
      parent_id: input.parent_id ?? null,
      color: input.color ?? null,
      icon: input.icon ?? null,
    })
    .executeTakeFirstOrThrow();

  return assertOwnCategory(userId, Number(result.insertId));
}

export async function updateCategory(
  userId: number,
  categoryId: number,
  input: CategoryUpdateInput
): Promise<CategoryRow> {
  const category = await assertOwnCategory(userId, categoryId);

  if (input.parent_id) {
    if (input.parent_id === categoryId) {
      throw new ApiError(
        422,
        "Kategori tidak boleh menjadi induk dirinya sendiri",
        "INVALID_PARENT"
      );
    }
    const parent = await assertOwnCategory(userId, input.parent_id);
    if (parent.type !== category.type) {
      throw new ApiError(
        422,
        "Tipe kategori harus sama dengan tipe induknya",
        "PARENT_TYPE_MISMATCH"
      );
    }
  }

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.parent_id !== undefined) updates.parent_id = input.parent_id;
  if (input.color !== undefined) updates.color = input.color;
  if (input.icon !== undefined) updates.icon = input.icon;

  if (Object.keys(updates).length > 0) {
    await db
      .updateTable("categories")
      .set(updates)
      .where("user_id", "=", userId)
      .where("id", "=", categoryId)
      .execute();
  }
  return assertOwnCategory(userId, categoryId);
}

export async function deleteCategory(
  userId: number,
  categoryId: number
): Promise<void> {
  await assertOwnCategory(userId, categoryId);
  // FK transaksi ON DELETE SET NULL — transaksi lama jadi "tanpa kategori",
  // budget dengan kategori ini ikut terhapus (FK CASCADE sesuai schema).
  await db
    .deleteFrom("categories")
    .where("user_id", "=", userId)
    .where("id", "=", categoryId)
    .execute();
}
