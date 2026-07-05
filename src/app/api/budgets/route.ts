import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api";
import { monthString } from "@/lib/validators/common";
import { budgetCreateSchema } from "@/lib/validators/budget";
import {
  createBudget,
  listBudgetsWithActuals,
} from "@/server/budget-service";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const raw = new URL(request.url).searchParams.get("month");
    const month = raw
      ? monthString.parse(raw)
      : new Date().toISOString().slice(0, 7);
    const budgets = await listBudgetsWithActuals(user, month);
    return NextResponse.json({ month, budgets });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, budgetCreateSchema);
    await createBudget(user, input);
    const budgets = await listBudgetsWithActuals(user, input.period_month);
    return NextResponse.json(
      { month: input.period_month, budgets },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
