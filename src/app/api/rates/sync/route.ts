import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { syncRates } from "@/server/rate-service";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await syncRates(user.id, user.base_currency);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
