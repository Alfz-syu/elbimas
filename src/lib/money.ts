import Decimal from "decimal.js";

/**
 * Semua nilai uang dari DB berupa string DECIMAL — jangan pernah dihitung
 * dengan float. Gunakan helper di sini untuk aritmetika & format.
 */

export type MoneyLike = string | number | Decimal;

export function dec(value: MoneyLike): Decimal {
  return new Decimal(value);
}

/** Format ke kolom DECIMAL(20,4). */
export function toDbMoney(value: MoneyLike): string {
  return dec(value).toFixed(4);
}

/** Format ke kolom DECIMAL(20,8) (kurs). */
export function toDbRate(value: MoneyLike): string {
  return dec(value).toFixed(8);
}

export function sumMoney(values: MoneyLike[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(dec(v)), new Decimal(0));
}

/** Konversi nominal ke base currency memakai fx_rate_to_base. */
export function toBase(amount: MoneyLike, fxRateToBase: MoneyLike): Decimal {
  return dec(amount).times(dec(fxRateToBase));
}

const ZERO_DECIMAL_CURRENCIES = new Set(["IDR", "JPY", "KRW", "VND"]);

/** Format uang sesuai locale id-ID, mis. "Rp1.250.000" / "US$10.50". */
export function formatMoney(
  value: MoneyLike,
  currency: string,
  options?: { signDisplay?: "auto" | "always" | "never" | "exceptZero" }
): string {
  const num = dec(value).toNumber();
  const fractionDigits = ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      signDisplay: options?.signDisplay ?? "auto",
    }).format(num);
  } catch {
    // Kode currency tak dikenal Intl — fallback manual
    return `${currency} ${new Intl.NumberFormat("id-ID").format(num)}`;
  }
}

/** Format angka biasa (tanpa simbol currency) sesuai id-ID. */
export function formatNumber(value: MoneyLike, maxFraction = 2): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: maxFraction,
  }).format(dec(value).toNumber());
}
