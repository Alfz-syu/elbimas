import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api";
import { runDueRecurrings } from "@/server/recurring-service";

/**
 * Runner recurring — dua cara pemanggilan:
 * 1. Cron/uptime service: header `x-cron-secret` = env CRON_SECRET → proses SEMUA user.
 * 2. User login (tombol "jalankan sekarang"): tanpa header → proses milik user itu saja.
 * Idempotent: aman dipanggil berkali-kali dalam sehari.
 */
export async function POST(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    const providedSecret = request.headers.get("x-cron-secret");

    if (providedSecret !== null) {
      if (!secret || providedSecret !== secret) {
        throw new ApiError(401, "Cron secret tidak valid", "INVALID_CRON_SECRET");
      }
      const result = await runDueRecurrings();
      return NextResponse.json({ result });
    }

    const user = await getCurrentUser();
    if (!user) {
      throw new ApiError(401, "Tidak terautentikasi", "UNAUTHENTICATED");
    }
    const result = await runDueRecurrings(user.id);
    return NextResponse.json({ result });
  } catch (err) {
    return handleApiError(err);
  }
}
