import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api";
import { rateUpsertSchema } from "@/lib/validators/rate";
import { listRates, upsertRate } from "@/server/rate-service";

export async function GET() {
  try {
    const user = await requireUser();
    const rates = await listRates(user.id);
    return NextResponse.json({ rates });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, rateUpsertSchema);
    await upsertRate(user.id, user.base_currency, input);
    const rates = await listRates(user.id);
    return NextResponse.json({ rates }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
