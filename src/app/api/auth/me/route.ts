import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ApiError, handleApiError, parseJsonBody } from "@/lib/api";
import { profileUpdateSchema } from "@/lib/validators/auth";
import { db } from "@/db/client";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, profileUpdateSchema);

    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.base_currency !== undefined) {
      const currency = await db
        .selectFrom("currencies")
        .select("code")
        .where("code", "=", input.base_currency)
        .executeTakeFirst();
      if (!currency) {
        throw new ApiError(
          422,
          "Mata uang tidak dikenal",
          "UNKNOWN_CURRENCY"
        );
      }
      updates.base_currency = input.base_currency;
    }

    if (Object.keys(updates).length > 0) {
      await db
        .updateTable("users")
        .set(updates)
        .where("id", "=", user.id)
        .execute();
    }

    const updated = await db
      .selectFrom("users")
      .select(["id", "email", "name", "base_currency"])
      .where("id", "=", user.id)
      .executeTakeFirstOrThrow();
    return NextResponse.json({ user: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
