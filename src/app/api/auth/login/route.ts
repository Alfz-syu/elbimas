import { NextResponse } from "next/server";
import { handleApiError, jsonError, parseJsonBody } from "@/lib/api";
import { loginSchema } from "@/lib/validators/auth";
import { loginUser } from "@/server/auth-service";
import { setSessionCookie } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const { allowed, retryAfterSec } = rateLimit(
      `login:${ip}`,
      10,
      15 * 60 * 1000
    );
    if (!allowed) {
      return jsonError(
        429,
        `Terlalu banyak percobaan. Coba lagi dalam ${retryAfterSec} detik.`,
        "RATE_LIMITED"
      );
    }

    const input = await parseJsonBody(request, loginSchema);
    const user = await loginUser(input);
    await setSessionCookie(user.id);
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
