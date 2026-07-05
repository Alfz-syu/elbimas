import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { getWallet } from "@/server/wallet-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = idParam.parse((await params).id);
    const wallet = await getWallet(user.id, id);
    return NextResponse.json({
      wallet_id: wallet.id,
      currency: wallet.currency,
      balance: wallet.balance,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
