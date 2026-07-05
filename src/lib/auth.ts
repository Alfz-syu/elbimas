import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { db } from "@/db/client";
import { unauthorized } from "@/lib/api";

const SESSION_COOKIE = "elbimas_session";
const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 hari
const BCRYPT_COST = 10;

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET belum di-set di environment");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(userId: number): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(jwtSecret());
}

export async function verifySessionToken(
  token: string
): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    const userId = payload.userId;
    return typeof userId === "number" && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: number): Promise<void> {
  const token = await signSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  base_currency: string;
}

/**
 * Ambil user login dari cookie sesi. Null kalau tidak login.
 * Di-cache per-request (React cache) supaya layout + page tidak query dobel.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = await verifySessionToken(token);
  if (!userId) return null;

  const user = await db
    .selectFrom("users")
    .select(["id", "email", "name", "base_currency"])
    .where("id", "=", userId)
    .executeTakeFirst();

  return user ?? null;
});

/** Untuk route handlers: user login atau lempar 401. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

export { SESSION_COOKIE };
