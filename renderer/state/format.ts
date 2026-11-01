/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { StateFormat } from './schema';
import { isIsoDate } from './initial';
import { currencyDigits, isMoneyValue, isRecord } from './values';

import { nightsMessages } from '../site/messages';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type FormatOptions = {
  locale: string;
  /** The scope's currency (ISO 4217); a money value's own wins. */
  currency?: string | null;
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** What a value that is not there yet shows (a sum missing an operand). */
export const MISSING_VALUE = '—';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/** The Intl locale: Arabic keeps Latin digits (`ar-u-nu-latn`), as the sites do. */
export function intlLocale(locale: string): string {
  const primary = locale.toLowerCase().split(/[-_]/)[0] ?? '';
  if (primary !== 'ar' || locale.includes('-u-')) return locale;
  return `${locale}-u-nu-latn`;
}

/** A `YYYY-MM-DD` as a UTC midnight (how a date-only string parses), so no time zone shifts the day. */
function utcDate(iso: string): Date {
  return new Date(iso);
}

function dateFormat(locale: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'medium', timeZone: 'UTC' });
}

function numeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * A scope value as text, through `Intl` only. `currency` divides minor units
 * by the currency's digits (TND 3, EUR 2) — a money value's own currency,
 * else the scope's, else it formats as a plain number. A missing number or
 * date reads « — », missing text reads nothing. Pure.
 */
export function formatState(
  value: unknown,
  format: StateFormat | undefined,
  options: FormatOptions
): string {
  const locale = intlLocale(options.locale);
  const numbers = (extra?: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, extra);
  const money = isMoneyValue(value) ? value : null;
  const n = numeric(money ? money.amount : value);
  switch (format ?? 'text') {
    case 'integer':
      return n === null ? MISSING_VALUE : numbers({ maximumFractionDigits: 0 }).format(n);
    case 'number':
      return n === null ? MISSING_VALUE : numbers().format(n);
    case 'currency': {
      if (n === null) return MISSING_VALUE;
      const currency = (money?.currency ?? options.currency ?? '').toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) return numbers().format(n);
      const amount = n / 10 ** currencyDigits(currency);
      try {
        return numbers({ style: 'currency', currency }).format(amount);
      } catch {
        return numbers().format(amount);
      }
    }
    case 'date':
      return isIsoDate(value) ? dateFormat(options.locale).format(utcDate(value)) : MISSING_VALUE;
    case 'dateRange': {
      if (!isRecord(value) || !isIsoDate(value.from)) return MISSING_VALUE;
      const formatter = dateFormat(options.locale);
      if (!isIsoDate(value.to)) return formatter.format(utcDate(value.from));
      return formatter.formatRange(utcDate(value.from), utcDate(value.to));
    }
    case 'nights': {
      if (n === null || money) return MISSING_VALUE;
      const forms = nightsMessages(options.locale);
      const template = forms[new Intl.PluralRules(locale).select(n)] ?? forms.other;
      return template.replace('{n}', numbers().format(n));
    }
    default:
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return numbers().format(value);
      return typeof value === 'boolean' ? String(value) : '';
  }
}
