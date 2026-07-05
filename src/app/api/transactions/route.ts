import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api";
import {
  transactionCreateSchema,
  transactionListQuerySchema,
} from "@/lib/validators/transaction";
import {
  createTransaction,
  listTransactions,
} from "@/server/transaction-service";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const query = transactionListQuerySchema.parse(params);
    const result = await listTransactions(user.id, query);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, transactionCreateSchema);
    const transaction = await createTransaction(user, input);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
