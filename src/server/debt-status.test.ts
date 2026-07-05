import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { computeStatus } from "./debt-service";

describe("debt — computeStatus (open/partial/settled)", () => {
  it("belum ada pembayaran → open", () => {
    expect(computeStatus(new Decimal(0), new Decimal(500000))).toBe("open");
  });

  it("pembayaran sebagian → partial", () => {
    expect(computeStatus(new Decimal(200000), new Decimal(500000))).toBe(
      "partial"
    );
  });

  it("pembayaran pas lunas → settled", () => {
    expect(computeStatus(new Decimal(500000), new Decimal(500000))).toBe(
      "settled"
    );
  });

  it("pembayaran melebihi pokok → settled", () => {
    expect(computeStatus(new Decimal(600000), new Decimal(500000))).toBe(
      "settled"
    );
  });

  it("pokok dinaikkan di atas total bayar → kembali partial", () => {
    expect(computeStatus(new Decimal(500000), new Decimal(600000))).toBe(
      "partial"
    );
  });

  it("presisi desimal: kurang 0.0001 tetap partial", () => {
    expect(
      computeStatus(new Decimal("499999.9999"), new Decimal("500000"))
    ).toBe("partial");
  });
});
