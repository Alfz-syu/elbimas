import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api";
import { transferCreateSchema } from "@/lib/validators/wallet";
import { dateString } from "@/lib/validators/common";
import { createTransfer, listTransfers } from "@/server/transfer-service";

const listQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const query = listQuerySchema.parse(params);
    const result = await listTransfers(user.id, query);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, transferCreateSchema);
    const transfer = await createTransfer(user.id, input);
    return NextResponse.json({ transfer }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
