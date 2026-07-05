import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { debtPaymentSchema } from "@/lib/validators/debt";
import { addDebtPayment } from "@/server/debt-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = idParam.parse((await params).id);
    const input = await parseJsonBody(request, debtPaymentSchema);
    const debt = await addDebtPayment(user.id, id, input);
    return NextResponse.json({ debt }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
