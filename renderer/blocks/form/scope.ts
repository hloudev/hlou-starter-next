/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { FieldDoc } from '../../contracts';
import type { ScopeDef, ScopeSnapshot, StateFormat } from '../../state/schema';
import type { ScopeStore } from '../../state/store';

import { formatState } from '../../state/format';
import { isRecord } from '../../state/values';
import { pathKey } from '../../state/when';

/* A form inside a scope, zod-free: the scope values a form posts
   through `fromState`, and the size-capped `state` it sends along. */

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** One `fromState` entry: a form field filled from a scope path. */
export type FromStateEntry = { field: string; path: string; as?: 'value' | 'text' };

/** The scope's state as the payload carries it: an estimate, never trusted for amounts. */
export type FormState = {
  values: ScopeSnapshot['values'];
  derived: ScopeSnapshot['derived'];
  estimate: true;
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** Above this many UTF-8 bytes of JSON the form posts without `state` (the server refuses it). */
export const FORM_STATE_MAX_BYTES = 16 * 1024;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * The derived keys that hold an amount: a `price`, a `lines`, and a `sum` or
 * `multiply` reading one of them — the ones the site labels « estimation ».
 */
function amountKeys(def: Pick<ScopeDef, 'derived'>): Set<string> {
  const keys = new Set<string>();
  for (const entry of def.derived) {
    if (entry.kind === 'price' || entry.kind === 'lines') keys.add(entry.key);
    else if (
      (entry.kind === 'sum' || entry.kind === 'multiply') &&
      entry.of.some((operand) => 'path' in operand && keys.has(pathKey(operand.path)))
    ) {
      keys.add(entry.key);
    }
  }
  return keys;
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * How `as: 'text'` formats a path, from what it names: a date range « 12–15
 * mars 2027 », a date, a number, a stay's nights « 3 nuits », a count, an
 * amount in the scope's currency; anything else as text.
 */
export function textFormatOf(def: Pick<ScopeDef, 'fields' | 'derived'>, path: string): StateFormat {
  const key = pathKey(path);
  const field = def.fields.find((entry) => entry.key === key);
  if (field) {
    if (field.type === 'dateRange') return path === key ? 'dateRange' : 'date';
    if (field.type === 'date') return 'date';
    if (field.type === 'number' || field.type === 'quantities') return 'number';
    return 'text';
  }
  if (amountKeys(def).has(key)) return 'currency';
  const derived = def.derived.find((entry) => entry.key === key);
  if (derived?.kind === 'nights') return 'nights';
  return derived?.kind === 'count' ? 'integer' : 'text';
}

/** A `lines` value as text: « Balade en 4×4 × 1, Balade à dromadaire × 2 », or `null`. */
function linesText(value: unknown): string | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  return value.items
    .filter(isRecord)
    .map((item) => `${String(item.title ?? '')} × ${String(item.qty ?? '')}`)
    .join(', ');
}

/**
 * The form fields `fromState` fills, read from the scope: by default the
 * value as the scope holds it — an amount the scope derives becomes `{
 * amount, currency }` for a `money` field — with `as: 'text'` formatted
 * (`formatState`; a choice reads its option's label; a `lines` value lists
 * « title × qty »). An entry naming no field of the form is skipped; a path
 * with nothing behind it posts `null`.
 */
export function fromStateData(
  store: Pick<ScopeStore, 'def' | 'read'>,
  entries: readonly FromStateEntry[],
  fields: readonly FieldDoc[],
  locale: string
): Record<string, unknown> {
  const { def } = store;
  const out: Record<string, unknown> = {};
  for (const entry of entries) {
    const field = fields.find((candidate) => candidate.key === entry.field);
    if (!field) continue;
    const value = store.read(entry.path);
    if (entry.as === 'text') {
      const choice = def.fields.find((candidate) => candidate.key === entry.path);
      const option =
        choice?.type === 'choice' ? choice.options.find((item) => item.value === value) : undefined;
      out[field.key] =
        option?.label ??
        linesText(value) ??
        formatState(value, textFormatOf(def, entry.path), { locale, currency: def.currency });
    } else if (field.type === 'money' && typeof value === 'number' && def.currency) {
      out[field.key] = { amount: Math.round(value), currency: def.currency };
    } else {
      out[field.key] = value ?? null;
    }
  }
  return out;
}

/**
 * The scope's state for the payload, or `undefined` when its JSON is over
 * `FORM_STATE_MAX_BYTES` — the form still posts, without it.
 */
export function formState(
  snapshot: Pick<ScopeSnapshot, 'values' | 'derived'>
): FormState | undefined {
  const state: FormState = { values: snapshot.values, derived: snapshot.derived, estimate: true };
  const bytes = new TextEncoder().encode(JSON.stringify(state)).length;
  return bytes <= FORM_STATE_MAX_BYTES ? state : undefined;
}
