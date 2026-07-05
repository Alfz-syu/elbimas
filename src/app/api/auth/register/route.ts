import { NextResponse } from "next/server";
import { handleApiError, jsonError, parseJsonBody } from "@/lib/api";
import { registerSchema } from "@/lib/validators/auth";
import { registerUser } from "@/server/auth-service";
import { setSessionCookie } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const { allowed, retryAfterSec } = rateLimit(
      `register:${ip}`,
      5,
      15 * 60 * 1000
    );
    if (!allowed) {
      return jsonError(
        429,
        `Terlalu banyak percobaan. Coba lagi dalam ${retryAfterSec} detik.`,
        "RATE_LIMITED"
      );
    }

    const input = await parseJsonBody(request, registerSchema);
    const user = await registerUser(input);
    await setSessionCookie(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
