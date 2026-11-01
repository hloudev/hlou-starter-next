/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { Condition, ScopeSnapshot } from './schema';
import { isRecord } from './values';

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** The path of the current step. */
export const STEP_PATH = '$step';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/** `a` against `b`, two numbers or two strings (ISO dates compare as strings); else nothing. */
function compare(a: unknown, b: unknown): number | null {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
  return null;
}

/** The four orderings, on `compare`'s result. */
const ORDERS: Record<string, (order: number) => boolean> = {
  gt: (order) => order > 0,
  gte: (order) => order >= 0,
  lt: (order) => order < 0,
  lte: (order) => order <= 0,
};

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * One level into a record: `dates.from`, `extras.<recordId>`, `extras.total`.
 * A path is a key, or a key and one dotted level.
 */
export function readIn(source: Record<string, unknown>, path: string): unknown {
  const dot = path.indexOf('.');
  if (dot < 0) return source[path];
  const head = source[path.slice(0, dot)];
  return isRecord(head) ? head[path.slice(dot + 1)] : undefined;
}

/** The first segment of a path: the field or derived key it names. */
export function pathKey(path: string): string {
  const dot = path.indexOf('.');
  return dot < 0 ? path : path.slice(0, dot);
}

/**
 * A path in the values, then in the derived values: the first that holds
 * something wins. A derived key may reuse a field's name — a booking's
 * `extras = lines(extras)` — so `extras.quad` is the field's quantity and
 * `extras.total` the lines' total.
 */
export function readScoped(
  values: Record<string, unknown>,
  derived: Record<string, unknown>,
  path: string
): unknown {
  const key = pathKey(path);
  const value = key in values ? readIn(values, path) : undefined;
  if (value !== undefined) return value;
  return key in derived ? readIn(derived, path) : undefined;
}

/** A path against a snapshot: the values, then the derived values, then `$step`. */
export function readPath(
  snapshot: Pick<ScopeSnapshot, 'values' | 'derived' | 'step'>,
  path: string
): unknown {
  if (path === STEP_PATH) return snapshot.step;
  return readScoped(snapshot.values, snapshot.derived, path);
}

/**
 * Nothing there: `null`, `''`, `[]`, a date range missing an end, quantities
 * that are all 0 (or none).
 */
export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (isRecord(value)) {
    if ('from' in value || 'to' in value) return !value.from || !value.to;
    const entries = Object.values(value);
    if (entries.every((entry) => typeof entry === 'number')) {
      return entries.every((entry) => entry === 0);
    }
  }
  return false;
}

/** One condition. */
export function evaluateCondition(
  condition: Condition,
  snapshot: Pick<ScopeSnapshot, 'values' | 'derived' | 'step'>
): boolean {
  const actual = readPath(snapshot, condition.path);
  const expected = condition.value;
  const equal = actual === expected || (actual === undefined && expected === null);
  const ordering = ORDERS[condition.op];
  if (ordering) {
    const order = compare(actual, expected);
    return order !== null && ordering(order);
  }
  switch (condition.op) {
    case 'eq':
      return equal;
    case 'neq':
      return !equal;
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    case 'truthy':
      return actual !== false && actual !== 0 && !isEmptyValue(actual);
    case 'empty':
      return isEmptyValue(actual);
    default:
      return false;
  }
}

/**
 * A `when` against a snapshot: its conditions AND-ed. Read defensively (a
 * stored node field may be anything): what is not a list of conditions
 * passes, and a malformed condition fails.
 */
export function evaluateWhen(
  when: unknown,
  snapshot: Pick<ScopeSnapshot, 'values' | 'derived' | 'step'>
): boolean {
  if (!Array.isArray(when) || when.length === 0) return true;
  return when.every(
    (condition) =>
      isRecord(condition) &&
      typeof condition.path === 'string' &&
      typeof condition.op === 'string' &&
      evaluateCondition(condition as Condition, snapshot)
  );
}

/** The step a `when` pins its subtree to (`{ path: '$step', op: 'eq', value }`), if any. */
export function stepOfWhen(when: unknown): string | undefined {
  if (!Array.isArray(when)) return undefined;
  for (const condition of when) {
    if (
      isRecord(condition) &&
      condition.path === STEP_PATH &&
      condition.op === 'eq' &&
      typeof condition.value === 'string'
    ) {
      return condition.value;
    }
  }
  return undefined;
}
