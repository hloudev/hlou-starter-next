/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { MoneyValue } from './schema';

/* Free of zod and of the contracts on purpose: the scope runtime that ships to
   the browser (`store.ts`, `dom.ts`) reads these, within a 4 KB budget. */

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** The catalog keeps at most this many records, across the scope's fields. */
export const CATALOG_MAX = 100;

/** A choice or quantities field without a `max` accepts up to this many. */
export const QUANTITY_MAX = 99;

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** JSON text → its value; anything unreadable → `null`. */
export function parseJson(raw: string | null | undefined): unknown {
  try {
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

/** A plain record: an object, not an array, not `null`. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The fraction digits of a currency, from `Intl` (TND 3, EUR 2, JPY 0). */
export function currencyDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

export function isMoneyValue(value: unknown): value is MoneyValue {
  return (
    isRecord(value) &&
    typeof value.amount === 'number' &&
    Number.isFinite(value.amount) &&
    typeof value.currency === 'string'
  );
}

/**
 * A record's price field → minor units of the scope currency: a money value
 * in that currency gives its amount, a plain number is scaled by the
 * currency's digits, anything else is `null`. With no scope currency a money
 * value still gives its amount and a plain number is taken as two digits.
 */
export function priceOf(value: unknown, currency: string | null): number | null {
  if (isMoneyValue(value)) {
    if (currency && value.currency.toUpperCase() !== currency) return null;
    return Math.round(value.amount);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value * 10 ** (currency ? currencyDigits(currency) : 2));
  }
  return null;
}
