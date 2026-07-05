import Decimal from "decimal.js";
import { sql } from "kysely";
import { db } from "@/db/client";
import { ApiError } from "@/lib/api";
import { dec, toDbRate } from "@/lib/money";
import type { RateUpsertInput } from "@/lib/validators/rate";

export interface RateRow {
  id: number;
  base_currency: string;
  quote_currency: string;
  rate: string;
  rate_date: string; // YYYY-MM-DD
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayString(): string {
  return toDateString(new Date());
}

/** Kurs terbaru per pasangan (base, quote) milik user. */
export async function listRates(userId: number): Promise<RateRow[]> {
  const rows = await db
    .selectFrom("exchange_rates")
    .select(["id", "base_currency", "quote_currency", "rate", "rate_date"])
    .where("user_id", "=", userId)
    .orderBy("base_currency")
    .orderBy("quote_currency")
    .orderBy("rate_date", "desc")
    .execute();

  // Ambil hanya entri terbaru per pasangan
  const seen = new Set<string>();
  const latest: RateRow[] = [];
  for (const row of rows) {
    const key = `${row.base_currency}/${row.quote_currency}`;
    if (seen.has(key)) continue;
    seen.add(key);
    latest.push({ ...row, rate_date: toDateString(row.rate_date) });
  }
  return latest;
}

export async function upsertRate(
  userId: number,
  userBaseCurrency: string,
  input: RateUpsertInput
): Promise<void> {
  const base = input.base_currency ?? userBaseCurrency;
  const date = input.rate_date ?? todayString();
  if (base === input.quote_currency) {
    throw new ApiError(
      422,
      "Mata uang dasar dan tujuan tidak boleh sama",
      "SAME_CURRENCY"
    );
  }

  await db
    .insertInto("exchange_rates")
    .values({
      user_id: userId,
      base_currency: base,
      quote_currency: input.quote_currency,
      rate: toDbRate(input.rate),
      rate_date: date,
    })
    .onDuplicateKeyUpdate({ rate: toDbRate(input.rate) })
    .execute();
}

/**
 * Kurs konversi: 1 `from` = ? `to`, dari kurs tersimpan milik user.
 * Coba pasangan langsung, lalu kebalikannya (1/rate). Null kalau tidak ada.
 * Dipakai untuk mengisi fx_rate_to_base transaksi.
 */
export async function findConversionRate(
  userId: number,
  from: string,
  to: string
): Promise<string | null> {
  if (from === to) return "1";

  const direct = await db
    .selectFrom("exchange_rates")
    .select("rate")
    .where("user_id", "=", userId)
    .where("base_currency", "=", from)
    .where("quote_currency", "=", to)
    .orderBy("rate_date", "desc")
    .limit(1)
    .executeTakeFirst();
  if (direct) return dec(direct.rate).toFixed(8);

  const inverse = await db
    .selectFrom("exchange_rates")
    .select("rate")
    .where("user_id", "=", userId)
    .where("base_currency", "=", to)
    .where("quote_currency", "=", from)
    .orderBy("rate_date", "desc")
    .limit(1)
    .executeTakeFirst();
  if (inverse && dec(inverse.rate).gt(0)) {
    return new Decimal(1).div(dec(inverse.rate)).toFixed(8);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sinkronisasi kurs dari API gratis TANPA key (PRD Bagian 8):
// Primary: Frankfurter. Fallback: fawazahmed0 exchange-api via jsDelivr.
// Caching per hari: pasangan yang sudah punya kurs hari ini dilewati.
// ---------------------------------------------------------------------------

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchFrankfurter(
  base: string,
  symbols: string[]
): Promise<Record<string, number> | null> {
  const root = process.env.FX_PRIMARY_URL ?? "https://api.frankfurter.dev";
  const query = `latest?base=${base}&symbols=${symbols.join(",")}`;
  // Coba beberapa versi path API (v2 → v1 → tanpa versi)
  for (const path of [`/v2/${query}`, `/v1/${query}`, `/${query}`]) {
    const data = (await fetchJson(`${root}${path}`)) as {
      rates?: Record<string, number>;
    } | null;
    if (data?.rates && typeof data.rates === "object") return data.rates;
  }
  return null;
}

async function fetchFawazAhmed(
  base: string
): Promise<Record<string, number> | null> {
  const baseLower = base.toLowerCase();
  const urls = [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${baseLower}.json`,
    `https://latest.currency-api.pages.dev/v1/currencies/${baseLower}.json`,
  ];
  for (const url of urls) {
    const data = (await fetchJson(url)) as Record<string, unknown> | null;
    const rates = data?.[baseLower];
    if (rates && typeof rates === "object") {
      const upper: Record<string, number> = {};
      for (const [code, value] of Object.entries(
        rates as Record<string, number>
      )) {
        if (typeof value === "number") upper[code.toUpperCase()] = value;
      }
      return upper;
    }
  }
  return null;
}

export interface SyncResult {
  base_currency: string;
  synced: string[];
  skipped_cached: string[];
  failed: string[];
}

export async function syncRates(
  userId: number,
  userBaseCurrency: string
): Promise<SyncResult> {
  const base = userBaseCurrency;
  const today = todayString();

  const allCurrencies = await db
    .selectFrom("currencies")
    .select("code")
    .execute();
  const targets = allCurrencies.map((c) => c.code).filter((c) => c !== base);

  // Cache per hari: lewati pasangan yang sudah ada kursnya hari ini
  const existingToday = await db
    .selectFrom("exchange_rates")
    .select("quote_currency")
    .where("user_id", "=", userId)
    .where("base_currency", "=", base)
    .where("rate_date", "=", sql<Date>`${today}`)
    .execute();
  const cached = new Set(existingToday.map((r) => r.quote_currency));
  const toFetch = targets.filter((c) => !cached.has(c));

  const result: SyncResult = {
    base_currency: base,
    synced: [],
    skipped_cached: [...cached],
    failed: [],
  };
  if (toFetch.length === 0) return result;

  const collected: Record<string, number> = {};

  const primary = await fetchFrankfurter(base, toFetch);
  if (primary) {
    for (const code of toFetch) {
      if (typeof primary[code] === "number" && primary[code] > 0) {
        collected[code] = primary[code];
      }
    }
  }

  const missing = toFetch.filter((c) => !(c in collected));
  if (missing.length > 0) {
    const fallback = await fetchFawazAhmed(base);
    if (fallback) {
      for (const code of missing) {
        if (typeof fallback[code] === "number" && fallback[code] > 0) {
          collected[code] = fallback[code];
        }
      }
    }
  }

  result.failed = toFetch.filter((c) => !(c in collected));

  const entries = Object.entries(collected);
  if (entries.length === 0) {
    throw new ApiError(
      502,
      "Gagal mengambil kurs dari semua sumber. Kamu tetap bisa mengisi kurs manual.",
      "FX_SYNC_FAILED"
    );
  }

  for (const [quote, value] of entries) {
    await db
      .insertInto("exchange_rates")
      .values({
        user_id: userId,
        base_currency: base,
        quote_currency: quote,
        rate: toDbRate(value),
        rate_date: today,
      })
      .onDuplicateKeyUpdate({ rate: toDbRate(value) })
      .execute();
    result.synced.push(quote);
  }

  return result;
}
