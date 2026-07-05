import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api";
import { recurringCreateSchema } from "@/lib/validators/recurring";
import { createRecurring, listRecurrings } from "@/server/recurring-service";

export async function GET() {
  try {
    const user = await requireUser();
    const recurrings = await listRecurrings(user.id);
    return NextResponse.json({ recurrings });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, recurringCreateSchema);
    const recurring = await createRecurring(user, input);
    return NextResponse.json({ recurring }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
