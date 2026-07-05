import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api";
import { walletCreateSchema } from "@/lib/validators/wallet";
import { createWallet, listWallets } from "@/server/wallet-service";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const includeArchived =
      new URL(request.url).searchParams.get("archived") === "1";
    const wallets = await listWallets(user.id, { includeArchived });
    return NextResponse.json({ wallets });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, walletCreateSchema);
    const wallet = await createWallet(user.id, input);
    return NextResponse.json({ wallet }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
