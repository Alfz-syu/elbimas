import { describe, expect, it } from "vitest";
import { dec, formatMoney, sumMoney, toBase, toDbMoney, toDbRate } from "./money";

describe("money — presisi desimal", () => {
  it("tidak kena floating point error klasik (0.1 + 0.2)", () => {
    expect(sumMoney(["0.1", "0.2"]).toString()).toBe("0.3");
  });

  it("toDbMoney membulatkan ke 4 desimal", () => {
    expect(toDbMoney("1000000")).toBe("1000000.0000");
    expect(toDbMoney("10.123456")).toBe("10.1235");
  });

  it("toDbRate membulatkan ke 8 desimal", () => {
    expect(toDbRate("16260.16")).toBe("16260.16000000");
    expect(toDbRate("0.0000615")).toBe("0.00006150");
  });

  it("sumMoney menjumlahkan string DECIMAL besar tanpa kehilangan presisi", () => {
    const total = sumMoney(["999999999999.9999", "0.0001"]);
    expect(total.toString()).toBe("1000000000000");
  });
});

describe("money — konversi currency (toBase)", () => {
  it("mengalikan amount × fx_rate_to_base", () => {
    // 50 USD × 16260.16 = 813008 IDR
    expect(toBase("50", "16260.16").toString()).toBe("813008");
  });

  it("kurs inverse kecil tetap presisi", () => {
    // 163000 IDR × 0.0000615 = 10.0245 USD
    expect(toBase("163000", "0.0000615").toString()).toBe("10.0245");
  });

  it("fx 1 mengembalikan nominal sama", () => {
    expect(toBase("250000", "1").toString()).toBe("250000");
  });
});

describe("money — formatMoney id-ID", () => {
  // Versi ICU bisa beda soal spasi setelah simbol — normalisasi dulu.
  const strip = (s: string) => s.replace(/[\s  ]/g, "");

  it("IDR tanpa desimal", () => {
    expect(strip(formatMoney("1250000", "IDR"))).toBe("Rp1.250.000");
  });

  it("USD dengan 2 desimal", () => {
    expect(strip(formatMoney("10.5", "USD"))).toBe("US$10,50");
  });

  it("currency tak dikenal Intl memakai fallback", () => {
    expect(formatMoney("100", "ZZZ")).toContain("ZZZ");
  });
});
