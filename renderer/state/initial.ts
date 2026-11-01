/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { DateRangeValue, QuantitiesValue, ScopeDef, ScopeDefField } from './schema';
import { isRecord, QUANTITY_MAX } from './values';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** What a URL query may come as: `location.search`, parsed params, or a plain map. */
export type QueryInput = string | URLSearchParams | Record<string, string> | null | undefined;

export type InitialInput = {
  /** The parsed sessionStorage entry (`storageKey`), or `null`. */
  storage?: Record<string, unknown> | null;
  query?: QueryInput;
  /** `YYYY-MM-DD`: what a `min: 'today'` means. */
  today: string;
};

/** What a boolean reads from a default, storage or the URL. */
const BOOLEANS: Record<string, boolean | undefined> = {
  true: true,
  1: true,
  false: false,
  0: false,
};

/** A field's value with nothing set: what `reset` goes back to before the default. */
type Empty = null | '' | false | QuantitiesValue;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A real calendar day in `YYYY-MM-DD` (`2027-13-01` and `2027-02-30` are
 * not): a date-only string parses as UTC midnight, and an invalid day rolls
 * over or fails to parse.
 */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const time = Date.parse(value);
  return time === time && new Date(time).toISOString().startsWith(value);
}

/** Whole days from `from` to `to`, both `YYYY-MM-DD` (parsed as UTC). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

/** The query as one lookup; a repeated parameter keeps its last value. */
function queryReader(query: QueryInput): (name: string) => string | undefined {
  const params = new URLSearchParams(query ?? undefined);
  return (name) => params.getAll(name).at(-1);
}

/** A number off the query (a string) or out of storage / a default (a number). */
function toNumber(value: unknown): number | undefined {
  const n = typeof value === 'string' && value.trim() ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

/** Floating error off (`0.1 + 0.2`): a snapped number keeps ten decimals at most. */
function tidy(value: number): number {
  return Number(value.toFixed(10));
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** Where a scope's values persist: `hl:scope:<path>:<id>`. */
export function storageKey(path: string, id: string): string {
  return `hl:scope:${path}:${id}`;
}

/** A field's value with nothing chosen yet. */
export function emptyValue(field: ScopeDefField): Empty {
  if (field.type === 'quantities') return {};
  return field.type === 'text' ? '' : field.type === 'boolean' ? false : null;
}

/** A number field's value: snapped to `increment` (from `min`, else 0), then clamped. */
export function clampNumber(field: Extract<ScopeDefField, { type: 'number' }>, n: number): number {
  let value = n;
  if (field.increment && field.increment > 0) {
    const origin = field.min ?? 0;
    value = tidy(origin + Math.round((value - origin) / field.increment) * field.increment);
  }
  if (field.min !== undefined && value < field.min) value = field.min;
  if (field.max !== undefined && value > field.max) value = field.max;
  return value;
}

/** A quantities field's cap. */
export function quantityMax(field: Extract<ScopeDefField, { type: 'quantities' }>): number {
  return field.max ?? QUANTITY_MAX;
}

/** A date field's `min`, `'today'` resolved. */
function dateMin(min: string | undefined, today: string): string | undefined {
  return min === 'today' ? today : min;
}

/**
 * One raw value (a default, a stored value, a query string) as a valid value
 * of `field`, or `undefined` when it is not one. Never throws.
 */
export function coerceValue(
  field: ScopeDefField,
  raw: unknown,
  def: Pick<ScopeDef, 'catalog'>,
  today: string
): unknown {
  if (raw === undefined) return undefined;
  switch (field.type) {
    case 'number': {
      if (raw === null) return null;
      const n = toNumber(raw);
      return n === undefined ? undefined : clampNumber(field, n);
    }
    case 'text': {
      if (typeof raw !== 'string') return undefined;
      return field.maxLength !== undefined ? raw.slice(0, field.maxLength) : raw;
    }
    case 'boolean':
      return BOOLEANS[String(raw)];
    case 'choice': {
      if (raw === null) return null;
      if (typeof raw !== 'string') return undefined;
      const known = field.options.some((option) => option.value === raw) || raw in def.catalog;
      return known ? raw : undefined;
    }
    case 'date': {
      if (raw === null) return null;
      if (!isIsoDate(raw)) return undefined;
      const min = dateMin(field.min, today);
      return min && raw < min ? undefined : raw;
    }
    case 'dateRange': {
      if (raw === null) return null;
      if (!isRecord(raw) || !isIsoDate(raw.from)) return undefined;
      const from = raw.from;
      if (field.min === 'today' && from < today) return undefined;
      /* Only the start picked: a range on its way, valid as it is. */
      if (!raw.to) return { from, to: null } satisfies DateRangeValue;
      if (!isIsoDate(raw.to) || raw.to < from) return undefined;
      const nights = daysBetween(from, raw.to);
      if (field.minNights !== undefined && nights < field.minNights) return undefined;
      if (field.maxNights !== undefined && nights > field.maxNights) return undefined;
      return { from, to: raw.to } satisfies DateRangeValue;
    }
    case 'quantities': {
      if (!isRecord(raw)) return undefined;
      const allowed = new Set(field.items);
      const max = quantityMax(field);
      const out: QuantitiesValue = {};
      for (const [id, qty] of Object.entries(raw)) {
        const n = toNumber(qty);
        if (!allowed.has(id) || n === undefined || !Number.isInteger(n)) continue;
        out[id] = Math.min(Math.max(0, n), max);
      }
      return out;
    }
    default:
      return undefined;
  }
}

/**
 * The raw value the URL gives a field, or `undefined`: the parameter its
 * `fromQuery` names, by default its key — `from` / `to` for a date range.
 * (A quantities field reads a string here, which it never accepts.)
 */
function fromQuery(field: ScopeDefField, read: (name: string) => string | undefined): unknown {
  if (field.type !== 'dateRange')
    return read(('fromQuery' in field && field.fromQuery) || field.key);
  const names = field.fromQuery ?? { from: 'from', to: 'to' };
  const from = read(names.from);
  return from === undefined ? undefined : { from, to: read(names.to) ?? null };
}

/**
 * A scope's first values: each field's default, then what sessionStorage
 * kept, then the URL query — the last VALID value wins, every value coerced
 * (numbers clamped and snapped, choices among their options, dates past
 * `min`, ranges ordered and within their nights). Pure; an invalid value is
 * dropped, never thrown. A field reads the query parameter `fromQuery`
 * names, by default its own key (`from` / `to` for a date range).
 */
export function initialValues(def: ScopeDef, input: InitialInput): Record<string, unknown> {
  const { today } = input;
  const storage = isRecord(input.storage) ? input.storage : null;
  const read = queryReader(input.query);
  const values: Record<string, unknown> = {};
  for (const field of def.fields) {
    let value: unknown = emptyValue(field);
    const candidates: unknown[] = [
      'default' in field ? field.default : undefined,
      storage ? storage[field.key] : undefined,
      fromQuery(field, read),
    ];
    for (const candidate of candidates) {
      const coerced = coerceValue(field, candidate, def, today);
      if (coerced !== undefined) value = coerced;
    }
    values[field.key] = value;
  }
  return values;
}

/**
 * Today in `YYYY-MM-DD`, in the clock's own time zone (the visitor's, in a
 * browser): Swedish writes dates the ISO way.
 */
export function todayIso(now: Date = new Date()): string {
  return now.toLocaleDateString('sv-SE');
}
