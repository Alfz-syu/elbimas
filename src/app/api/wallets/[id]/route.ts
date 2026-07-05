import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { walletUpdateSchema } from "@/lib/validators/wallet";
import {
  deleteWallet,
  getWallet,
  updateWallet,
} from "@/server/wallet-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = idParam.parse((await params).id);
    const wallet = await getWallet(user.id, id);
    return NextResponse.json({ wallet });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = idParam.parse((await params).id);
    const input = await parseJsonBody(request, walletUpdateSchema);
    const wallet = await updateWallet(user.id, id, input);
    return NextResponse.json({ wallet });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const id = idParam.parse((await params).id);
    await deleteWallet(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
