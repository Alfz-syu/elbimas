import { describe, expect, it } from "vitest";
import { advanceRunDate } from "./recurring-service";

describe("recurring — advanceRunDate", () => {
  it("daily maju N hari (termasuk lintas bulan)", () => {
    expect(advanceRunDate("2026-07-05", "daily", 1)).toBe("2026-07-06");
    expect(advanceRunDate("2026-07-30", "daily", 3)).toBe("2026-08-02");
  });

  it("weekly maju N minggu", () => {
    expect(advanceRunDate("2026-07-05", "weekly", 1)).toBe("2026-07-12");
    expect(advanceRunDate("2026-07-05", "weekly", 2)).toBe("2026-07-19");
  });

  it("monthly maju N bulan", () => {
    expect(advanceRunDate("2026-05-03", "monthly", 1)).toBe("2026-06-03");
    expect(advanceRunDate("2026-05-03", "monthly", 3)).toBe("2026-08-03");
  });

  it("monthly dari akhir bulan di-clamp (31 Jan → 28 Feb, bukan overflow)", () => {
    expect(advanceRunDate("2026-01-31", "monthly", 1)).toBe("2026-02-28");
    expect(advanceRunDate("2026-08-31", "monthly", 1)).toBe("2026-09-30");
  });

  it("monthly clamp tahun kabisat (31 Jan 2028 → 29 Feb 2028)", () => {
    expect(advanceRunDate("2028-01-31", "monthly", 1)).toBe("2028-02-29");
  });

  it("yearly maju N tahun; 29 Feb kabisat → 28 Feb tahun biasa", () => {
    expect(advanceRunDate("2026-07-05", "yearly", 1)).toBe("2027-07-05");
    expect(advanceRunDate("2028-02-29", "yearly", 1)).toBe("2029-02-28");
  });

  it("lintas tahun (Des → Jan)", () => {
    expect(advanceRunDate("2026-12-15", "monthly", 1)).toBe("2027-01-15");
  });
});
