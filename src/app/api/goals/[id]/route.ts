import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { goalUpdateSchema } from "@/lib/validators/goal";
import { deleteGoal, updateGoal } from "@/server/goal-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = idParam.parse((await params).id);
    const input = await parseJsonBody(request, goalUpdateSchema);
    const goal = await updateGoal(user.id, id, input);
    return NextResponse.json({ goal });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = idParam.parse((await params).id);
    await deleteGoal(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
