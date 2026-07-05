import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api";
import { debtCreateSchema } from "@/lib/validators/debt";
import { createDebt, listDebts } from "@/server/debt-service";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const typeParam = new URL(request.url).searchParams.get("type");
    const type =
      typeParam === "payable" || typeParam === "receivable"
        ? typeParam
        : undefined;
    const debts = await listDebts(user.id, type);
    return NextResponse.json({ debts });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, debtCreateSchema);
    const debt = await createDebt(user, input);
    return NextResponse.json({ debt }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
