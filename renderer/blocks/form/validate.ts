/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { FieldDoc } from '../../contracts';
import { parseMoney } from './inputs/money';
import { toE164 } from './inputs/phone';

/* The form island's own checks (M40-16), zod-free: what each input posts
   and the message it shows. The server validates the same data again
   (`buildRecordSchema`); these only spare the visitor a round trip. */

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** The error a field shows, worded by the island's `messages` (`StateMessages`). */
export type FieldErrorCode = 'required' | 'email' | 'phone' | 'money' | 'dateOrder';

export type FieldOutcome = { value: unknown; error: FieldErrorCode | null };

/** An input's posted text by name (the form's `FormData`), `null` when it has none. */
export type ReadInput = (name: string) => string | null;

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** One `@`, something on each side, a dot in the domain: a shape, not a mailbox check. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The phone select's name: the number's own, plus this. */
export const DIAL_SUFFIX = ':cc';

/** A money field without a currency (the inspector always sets one; A1 defaults to it too). */
const FALLBACK_CURRENCY = 'TND';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/** A string option of a field (`currency`, `defaultCountry`), or `''`. */
function optionText(field: FieldDoc, key: string): string {
  const options = field.options;
  if (typeof options !== 'object' || options === null || Array.isArray(options)) return '';
  const value = (options as Record<string, unknown>)[key];
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

const isDay = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** A money field's currency (its options), else TND. */
export function fieldCurrency(field: FieldDoc): string {
  return optionText(field, 'currency') || FALLBACK_CURRENCY;
}

/** A phone or country field's default country (its options), or `''`. */
export function fieldCountry(field: FieldDoc): string {
  return optionText(field, 'defaultCountry');
}

/**
 * What one field posts, and its error. `range` is a `daterange` field's
 * value (the calendar renders no input). The ten older types post what they
 * always did (a blank text is `''`); the four of decision 200 post `null`
 * when blank, else their stored shape: money `{ amount, currency }` in minor
 * units, a range `{ from, to }`, a phone E.164, a country its code.
 */
export function readField(field: FieldDoc, read: ReadInput, range?: unknown): FieldOutcome {
  const raw = read(field.key);
  const text = raw ?? '';
  const blank = text.trim() === '';
  const filled = (value: unknown): FieldOutcome => ({
    value,
    error:
      field.required && (value === null || (typeof value === 'string' && value.trim() === ''))
        ? 'required'
        : null,
  });

  switch (field.type) {
    case 'boolean':
      return { value: raw === 'on', error: null };
    case 'number':
      return filled(blank ? null : Number(text));
    case 'email':
      if (blank) return filled(raw);
      return { value: raw, error: EMAIL_PATTERN.test(text.trim()) ? null : 'email' };
    case 'money': {
      const money = parseMoney(text, fieldCurrency(field));
      return money === 'invalid' ? { value: null, error: 'money' } : filled(money);
    }
    case 'phone': {
      const phone = toE164(read(`${field.key}${DIAL_SUFFIX}`) ?? '', text);
      return phone === 'invalid' ? { value: null, error: 'phone' } : filled(phone);
    }
    case 'country':
      return filled(blank ? null : text);
    case 'daterange': {
      const ends =
        typeof range === 'object' && range !== null ? (range as Record<string, unknown>) : {};
      const from = isDay(ends.from) ? ends.from : null;
      const to = isDay(ends.to) ? ends.to : null;
      if (!from && !to) return filled(null);
      if (!from || !to || to < from) return { value: null, error: 'dateOrder' };
      return { value: { from, to }, error: null };
    }
    default:
      return filled(raw);
  }
}

/** Every field's value and the errors, by key, in the fields' order. */
export function readFields(
  fields: readonly FieldDoc[],
  read: ReadInput,
  ranges: Readonly<Record<string, unknown>>
): { data: Record<string, unknown>; errors: Record<string, FieldErrorCode> } {
  const data: Record<string, unknown> = {};
  const errors: Record<string, FieldErrorCode> = {};
  for (const field of fields) {
    const outcome = readField(field, read, ranges[field.key]);
    data[field.key] = outcome.value;
    if (outcome.error) errors[field.key] = outcome.error;
  }
  return { data, errors };
}
