/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { CURRENCY_CODE, isCurrencyCode } from './money-format';

/* The guards and formatting, free of zod for the browser (`money-format.ts`). */
export {
  currencyDigits,
  formatDateRange,
  formatMoney,
  fromMinorUnits,
  isCurrencyCode,
  isMoneyValue,
  numberLocale,
  toMinorUnits,
} from './money-format';

/* -------------------------------------------------------------------------- */
/*                                   VALUES                                   */
/* -------------------------------------------------------------------------- */

/*
 * The value shapes, shared by
 * the renderer, the state runtime, the site's form inputs and the collections
 * validator — pure, zod and `Intl` only, so all of them can import it.
 */

export const currencyCodeSchema = z
  .string()
  .regex(CURRENCY_CODE)
  .refine(isCurrencyCode, { error: 'Unknown currency' });

/**
 * A price: `amount` is an integer in the currency's MINOR units (450 TND is
 * `450000`, TND having three), `currency` an ISO 4217 code. Never localised.
 */
export const moneyValueSchema = z.object({
  amount: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  currency: currencyCodeSchema,
});
export type MoneyValue = z.infer<typeof moneyValueSchema>;

/** A span of calendar days, both ends included: `from ≤ to`. Never localised. */
export const dateRangeValueSchema = z
  .object({ from: z.iso.date(), to: z.iso.date() })
  .refine((range) => range.from <= range.to, { error: 'The range ends before it starts' });
export type DateRangeValue = z.infer<typeof dateRangeValueSchema>;

export function isDateRangeValue(value: unknown): value is DateRangeValue {
  return dateRangeValueSchema.safeParse(value).success;
}
