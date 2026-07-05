import { z } from "zod";
import Decimal from "decimal.js";
import { currencyCode, dateString, moneyString } from "./common";

export const rateUpsertSchema = z.object({
  base_currency: currencyCode.optional(), // default: base currency user
  quote_currency: currencyCode,
  rate: moneyString.refine(
    (v) => new Decimal(v).gt(0),
    "Kurs harus lebih dari 0"
  ),
  rate_date: dateString.optional(), // default: hari ini
});

export type RateUpsertInput = z.infer<typeof rateUpsertSchema>;
