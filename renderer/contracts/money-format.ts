/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { DateRangeValue, MoneyValue } from './money';

/* -------------------------------------------------------------------------- */
/*                                   VALUES                                   */
/* -------------------------------------------------------------------------- */

/*
 * The zod-free half of `money.ts`: the guards and formatting a browser island
 * draws a price with (`blocks/shared.tsx`), without the schemas.
 * `money.ts` re-exports every one; `money.test.ts` holds `isMoneyValue` to
 * `moneyValueSchema`'s verdicts.
 */

export const CURRENCY_CODE = /^[A-Z]{3}$/;

/** Every ISO 4217 code this runtime's `Intl` knows, or `null` where it cannot say (Hermes). */
function knownCurrencies(): ReadonlySet<string> | null {
  const supported = (Intl as { supportedValuesOf?: (key: 'currency') => string[] })
    .supportedValuesOf;
  return typeof supported === 'function' ? new Set(supported('currency')) : null;
}

let currencies: ReadonlySet<string> | null | undefined;

/** `TND` is a currency `Intl` knows; `XYZ` is three letters and nothing else. */
export function isCurrencyCode(code: string): boolean {
  if (!CURRENCY_CODE.test(code)) return false;
  if (currencies === undefined) currencies = knownCurrencies();
  return currencies === null || currencies.has(code);
}

/** `moneyValueSchema`, checked by hand: whole minor units, a known currency. */
export function isMoneyValue(value: unknown): value is MoneyValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const { amount, currency } = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(amount) &&
    (amount as number) >= 0 &&
    typeof currency === 'string' &&
    isCurrencyCode(currency)
  );
}

/* -------------------------------------------------------------------------- */
/*                                 FORMATTING                                 */
/* -------------------------------------------------------------------------- */

/** Arabic numbers are written with Latin digits, on sites and in the app: `ar` → `ar-u-nu-latn`. */
export function numberLocale(locale: string): string {
  return locale === 'ar' || locale.startsWith('ar-') ? `${locale.split('-')[0]}-u-nu-latn` : locale;
}

/** The currency's minor-unit digits, as `Intl` knows them: TND 3, EUR 2, JPY 0. */
export function currencyDigits(code: string): number {
  try {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/** `450` TND → `450000`. Rounds to the currency's precision. */
export function toMinorUnits(major: number, currency: string): number {
  return Math.round(major * 10 ** currencyDigits(currency));
}

/** `450000` TND → `450`. */
export function fromMinorUnits(minor: number, currency: string): number {
  return minor / 10 ** currencyDigits(currency);
}

/** « 450,000 TND » in French, « TND 450.000 » in English — as `Intl` prints it. */
export function formatMoney(value: MoneyValue, locale: string): string {
  const major = fromMinorUnits(value.amount, value.currency);
  try {
    return new Intl.NumberFormat(numberLocale(locale), {
      style: 'currency',
      currency: value.currency,
    }).format(major);
  } catch {
    return `${major} ${value.currency}`;
  }
}

/** A `YYYY-MM-DD` day as a UTC instant, so no time zone moves it. */
function dayInstant(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

/**
 * « 12–15 mars 2027 ». `formatRange` collapses what both ends share; where a
 * runtime lacks it (Hermes), the two days are joined in full.
 */
export function formatDateRange(value: DateRangeValue, locale: string): string {
  const format = new Intl.DateTimeFormat(numberLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const from = dayInstant(value.from);
  const to = dayInstant(value.to);
  if (value.from === value.to) return format.format(from);
  if (typeof format.formatRange === 'function') return format.formatRange(from, to);
  return `${format.format(from)} – ${format.format(to)}`;
}
