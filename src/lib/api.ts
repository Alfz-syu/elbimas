import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Error terkontrol yang membawa status HTTP + kode mesin. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function unauthorized(message = "Tidak terautentikasi"): ApiError {
  return new ApiError(401, message, "UNAUTHORIZED");
}

export function notFound(message = "Data tidak ditemukan"): ApiError {
  return new ApiError(404, message, "NOT_FOUND");
}

export function badRequest(message: string, code = "BAD_REQUEST"): ApiError {
  return new ApiError(400, message, code);
}

/** Response error konsisten: { error: { message, code } } */
export function jsonError(
  status: number,
  message: string,
  code: string
): NextResponse {
  return NextResponse.json({ error: { message, code } }, { status });
}

/** Ubah exception apa pun jadi response error konsisten. */
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return jsonError(err.status, err.message, err.code);
  }
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const message = first
      ? `${first.path.join(".") || "input"}: ${first.message}`
      : "Input tidak valid";
    return jsonError(422, message, "VALIDATION_ERROR");
  }
  console.error("[api] unexpected error:", err);
  return jsonError(500, "Terjadi kesalahan pada server", "INTERNAL_ERROR");
}

/** Ambil & validasi body JSON dengan schema Zod. */
export async function parseJsonBody<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    throw new ApiError(400, "Body harus berupa JSON valid", "INVALID_JSON");
  }
  return schema.parse(data);
}
