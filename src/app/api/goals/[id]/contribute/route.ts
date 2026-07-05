import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { goalContributeSchema } from "@/lib/validators/goal";
import { contributeToGoal } from "@/server/goal-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = idParam.parse((await params).id);
    const input = await parseJsonBody(request, goalContributeSchema);
    const goal = await contributeToGoal(user.id, id, input);
    return NextResponse.json({ goal });
  } catch (err) {
    return handleApiError(err);
  }
}
