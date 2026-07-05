import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api";
import { goalCreateSchema } from "@/lib/validators/goal";
import { createGoal, listGoals } from "@/server/goal-service";

export async function GET() {
  try {
    const user = await requireUser();
    const goals = await listGoals(user.id);
    return NextResponse.json({ goals });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, goalCreateSchema);
    const goal = await createGoal(user, input);
    return NextResponse.json({ goal }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
