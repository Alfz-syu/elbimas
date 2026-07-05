import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "elbimas_session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/wallets",
  "/budgets",
  "/goals",
  "/debts",
  "/recurring",
  "/settings",
  "/reports",
];

const AUTH_PAGES = ["/login", "/register"];

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    return typeof payload.userId === "number" && payload.userId > 0;
  } catch {
    return false;
  }
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  return response;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isProtected || isAuthPage) {
    const loggedIn = await isValidSession(token);

    if (isProtected && !loggedIn) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (isAuthPage && loggedIn) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/dashboard", request.url))
      );
    }
  }

  const response = withSecurityHeaders(NextResponse.next());
  // Area privat & API tidak boleh diindeks (PRD Bagian 10)
  if (isProtected || pathname.startsWith("/api")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: [
    // Semua route kecuali aset statis Next & file publik
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$).*)",
  ],
};
