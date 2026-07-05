import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { handleApiError } from "@/lib/api";

// Data referensi global (bukan data user) — aman tanpa auth.
export async function GET() {
  try {
    const currencies = await db
      .selectFrom("currencies")
      .select(["code", "name", "symbol"])
      .orderBy("code")
      .execute();
    return NextResponse.json({ currencies });
  } catch (err) {
    return handleApiError(err);
  }
}
