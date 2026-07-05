import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { monthString } from "@/lib/validators/common";
import { getMonthlySummary } from "@/server/report-service";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const raw = new URL(request.url).searchParams.get("month");
    const month = raw
      ? monthString.parse(raw)
      : new Date().toISOString().slice(0, 7);
    const summary = await getMonthlySummary(user, month);
    return NextResponse.json(summary);
  } catch (err) {
    return handleApiError(err);
  }
}
