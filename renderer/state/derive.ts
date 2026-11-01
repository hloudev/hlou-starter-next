/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { Derived, LineItem, LinesValue, Operand, ScopeDef } from './schema';
import { daysBetween, isIsoDate } from './initial';
import { isRecord } from './values';
import { pathKey, readScoped } from './when';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** Something wrong with a scope's derived list; the entry still runs, reading nothing. */
export type DeriveLint = {
  key: string;
  /** `forward`: a path names a derived key defined later (or itself). `unknown`: no such key. */
  reason: 'forward' | 'unknown';
  path: string;
};

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** The paths an entry reads. */
function pathsOf(entry: Derived): string[] {
  if (entry.kind === 'sum' || entry.kind === 'multiply') {
    return entry.of.flatMap((operand) => ('path' in operand ? [operand.path] : []));
  }
  return [entry.of];
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Every derived value of a scope, in order. An entry reads the values and
 * only the derived keys before it: a forward reference reads nothing (and
 * `lintDerived` reports it). A missing operand makes `sum` and `multiply`
 * `null` (« — »); `count` and `lines` are 0 when empty; `nights` is `null`
 * until both ends are picked. Pure, and run on every dispatch.
 */
export function deriveAll(
  def: Pick<ScopeDef, 'derived' | 'catalog' | 'fields'>,
  values: Record<string, unknown>
): Record<string, unknown> {
  const derived: Record<string, unknown> = {};

  /* `derived` holds only the entries before the current one. */
  const read = (path: string): unknown => readScoped(values, derived, path);
  const operand = (item: Operand): number | null =>
    'value' in item ? finite(item.value) : finite(read(item.path));

  for (const entry of def.derived) {
    switch (entry.kind) {
      case 'nights': {
        const range = read(entry.of);
        derived[entry.key] =
          isRecord(range) && isIsoDate(range.from) && isIsoDate(range.to)
            ? Math.max(0, daysBetween(range.from, range.to))
            : null;
        break;
      }
      case 'count': {
        const quantities = read(entry.of);
        derived[entry.key] = isRecord(quantities)
          ? Object.values(quantities).reduce<number>((sum, qty) => sum + (finite(qty) ?? 0), 0)
          : 0;
        break;
      }
      case 'sum': {
        const parts = entry.of.map(operand);
        derived[entry.key] = parts.some((part) => part === null)
          ? null
          : parts.reduce<number>((sum, part) => sum + (part as number), 0);
        break;
      }
      case 'multiply': {
        const parts = entry.of.map(operand);
        derived[entry.key] =
          parts.length === 0 || parts.some((part) => part === null)
            ? null
            : parts.reduce<number>((product, part) => product * (part as number), 1);
        break;
      }
      case 'price': {
        const chosen = read(entry.of);
        derived[entry.key] =
          typeof chosen === 'string' ? (def.catalog[chosen]?.price ?? null) : null;
        break;
      }
      case 'lines': {
        const quantities = read(entry.of);
        const field = def.fields.find((candidate) => candidate.key === pathKey(entry.of));
        const order = field?.type === 'quantities' ? field.items : [];
        const items: LineItem[] = [];
        if (isRecord(quantities)) {
          /* In the collection's order; a quantity is only ever kept for one of its records. */
          for (const id of order.filter((key) => key in quantities)) {
            const qty = finite(quantities[id]) ?? 0;
            if (qty <= 0) continue;
            const unit = def.catalog[id]?.price ?? null;
            items.push({
              id,
              title: def.catalog[id]?.title ?? '',
              qty,
              unit,
              amount: unit === null ? null : unit * qty,
            });
          }
        }
        const total = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
        derived[entry.key] = { items, total } satisfies LinesValue;
        break;
      }
      default:
        break;
    }
  }
  return derived;
}

/**
 * What is wrong with a scope's derived list: a path naming a derived key not
 * yet defined (a forward reference, or itself), or a key that is neither a
 * field nor a derived value. Shown by the inspector and the agent; at runtime
 * such a path reads nothing.
 */
export function lintDerived(def: Pick<ScopeDef, 'derived' | 'fields'>): DeriveLint[] {
  const fields = new Set(def.fields.map((field) => field.key));
  const all = new Set(def.derived.map((entry) => entry.key));
  const earlier = new Set<string>();
  const lints: DeriveLint[] = [];
  for (const entry of def.derived) {
    for (const path of pathsOf(entry)) {
      const key = pathKey(path);
      if (fields.has(key) || earlier.has(key)) continue;
      lints.push({ key: entry.key, reason: all.has(key) ? 'forward' : 'unknown', path });
    }
    earlier.add(entry.key);
  }
  return lints;
}
