/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { ResolvedRecord } from '../contracts';
import { CATALOG_MAX, priceOf, QUANTITY_MAX } from './values';

import {
  boundSchema,
  collectionSourceSchema,
  isRecordRef,
  isResolvedCollection,
  isSlotRef,
} from '../contracts';

export { isStateRef, stateBoundSchema, stateRefSchema } from '../contracts';
export { conditionSchema, whenSchema } from './condition';
export { CATALOG_MAX, currencyDigits, isMoneyValue, priceOf, QUANTITY_MAX } from './values';
export type { Condition, ConditionOp, When } from './condition';
export type { StateBound, StateFormat, StateRef } from '../contracts';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMAS                                  */
/* -------------------------------------------------------------------------- */

/* The contract of the state runtime, frozen. */

/** A field, step or derived key: a short camelCase word. */
export const scopeKeySchema = z.string().regex(/^[a-z][a-zA-Z0-9]{0,31}$/);
const key = scopeKeySchema;

/** `YYYY-MM-DD`. */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const base = {
  key,
  label: boundSchema(z.string()).optional(),
  required: z.boolean().optional(),
  /** The step whose « Suivant » checks this field. */
  onStep: z.string().optional(),
};

export const scopeFieldSchema = z.discriminatedUnion('type', [
  z.object({
    ...base,
    type: z.literal('number'),
    default: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    increment: z.number().positive().optional(),
    fromQuery: z.string().optional(),
  }),
  z.object({
    ...base,
    type: z.literal('text'),
    default: z.string().optional(),
    maxLength: z.number().int().max(500).optional(),
    fromQuery: z.string().optional(),
  }),
  z.object({ ...base, type: z.literal('boolean'), default: z.boolean().optional() }),
  z.object({
    ...base,
    type: z.literal('choice'),
    default: z.string().optional(),
    options: z.union([
      z.array(z.object({ value: z.string(), label: boundSchema(z.string()) })),
      z.object({
        source: collectionSourceSchema,
        titleField: z.string(),
        priceField: z.string().optional(),
      }),
    ]),
    fromQuery: z.string().optional(),
  }),
  z.object({
    ...base,
    type: z.literal('date'),
    min: z.union([z.literal('today'), isoDateSchema]).optional(),
    fromQuery: z.string().optional(),
  }),
  z.object({
    ...base,
    type: z.literal('dateRange'),
    min: z.literal('today').optional(),
    minNights: z.number().int().optional(),
    maxNights: z.number().int().optional(),
    fromQuery: z.object({ from: z.string(), to: z.string() }).optional(),
  }),
  z.object({
    ...base,
    type: z.literal('quantities'),
    source: collectionSourceSchema,
    titleField: z.string(),
    priceField: z.string(),
    max: z.number().int().max(99).optional(),
  }),
]);
export type ScopeField = z.infer<typeof scopeFieldSchema>;
export type ScopeFieldType = ScopeField['type'];

const operandSchema = z.union([z.object({ path: z.string() }), z.object({ value: z.number() })]);
export type Operand = z.infer<typeof operandSchema>;

/** Flat and ordered: an entry reads only earlier keys. */
export const derivedSchema = z.discriminatedUnion('kind', [
  /* A dateRange → an integer ≥ 0. */
  z.object({ key, kind: z.literal('nights'), of: z.string() }),
  /* Quantities → Σ qty. */
  z.object({ key, kind: z.literal('count'), of: z.string() }),
  z.object({ key, kind: z.literal('sum'), of: z.array(operandSchema).max(6) }),
  z.object({ key, kind: z.literal('multiply'), of: z.array(operandSchema).max(4) }),
  /* A choice from a collection → its price. */
  z.object({ key, kind: z.literal('price'), of: z.string() }),
  /* Quantities → `{ items: LineItem[], total }`. */
  z.object({ key, kind: z.literal('lines'), of: z.string() }),
]);
export type Derived = z.infer<typeof derivedSchema>;

export const scopeStepSchema = z.object({ id: key, label: boundSchema(z.string()) });

const jsonPrimitiveSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const actionSchema = z.discriminatedUnion('do', [
  z.object({ do: z.literal('set'), path: z.string(), value: jsonPrimitiveSchema }),
  z.object({
    do: z.enum(['inc', 'dec']),
    path: z.string(),
    key: z.string().optional(),
    by: z.number().optional(),
  }),
  z.object({ do: z.literal('toggle'), path: z.string() }),
  z.object({ do: z.literal('reset'), path: z.string().optional() }),
  z.object({ do: z.enum(['step.next', 'step.prev']) }),
  z.object({ do: z.literal('step.go'), step: z.string() }),
  z.object({ do: z.literal('submit') }),
  z.object({
    do: z.literal('navigate'),
    href: z.string(),
    query: z.record(z.string(), z.string()).optional(),
  }),
]);
export type Action = z.infer<typeof actionSchema>;

/** The `scope` block's own props, less its `content` slot (added by the block). */
export const scopePropsSchema = z.object({
  fields: z.array(scopeFieldSchema).max(24),
  steps: z.array(scopeStepSchema).max(8).optional(),
  derived: z.array(derivedSchema).max(16).optional(),
  /** ISO 4217. */
  currency: z.string().length(3).optional(),
  persist: z.enum(['none', 'session']).default('session'),
});

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** `{ from, to }`, `YYYY-MM-DD`; `to` is `null` while only the start is picked. */
export type DateRangeValue = { from: string; to: string | null };
/** `Record<recordId, qty>`. */
export type QuantitiesValue = Record<string, number>;
/** An amount in the currency's minor units (TND 3 digits, EUR 2). */
export type MoneyValue = { amount: number; currency: string };
export type LineItem = {
  id: string;
  title: string;
  qty: number;
  /** Minor units; `null` when the record has no price. */
  unit: number | null;
  amount: number | null;
};
export type LinesValue = { items: LineItem[]; total: number };

/** One catalog record: what a widget draws without re-binding the collection. */
export type CatalogEntry = {
  title: string;
  /** Minor units of the scope currency; `null` when it has none or another currency. */
  price: number | null;
};

/**
 * A field as the def carries it: labels are plain strings, and a field fed
 * by a collection names its records (the catalog holds their title and price)
 * instead of carrying the collection.
 */
type DefBase = { key: string; label?: string; required?: boolean; onStep?: string };
export type ScopeDefField = DefBase &
  (
    | {
        type: 'number';
        default?: number;
        min?: number;
        max?: number;
        increment?: number;
        fromQuery?: string;
      }
    | { type: 'text'; default?: string; maxLength?: number; fromQuery?: string }
    | { type: 'boolean'; default?: boolean }
    | {
        type: 'choice';
        default?: string;
        options: Array<{ value: string; label: string }>;
        fromQuery?: string;
      }
    | { type: 'date'; min?: string; fromQuery?: string }
    | {
        type: 'dateRange';
        min?: 'today';
        minNights?: number;
        maxNights?: number;
        fromQuery?: { from: string; to: string };
      }
    | { type: 'quantities'; items: string[]; max?: number }
  );

export type ScopeDefDerived = Derived;

/** What the shell serialises into `data-hl-scope-def`: everything the runtime needs. */
export type ScopeDef = {
  id: string;
  fields: ScopeDefField[];
  steps: Array<{ id: string; label: string }>;
  derived: ScopeDefDerived[];
  /** ISO 4217, or `null` (amounts then format as plain numbers). */
  currency: string | null;
  persist: 'none' | 'session';
  catalog: Record<string, CatalogEntry>;
};

export type ScopeSnapshot = Readonly<{
  values: Record<string, unknown>;
  derived: Record<string, unknown>;
  step: string | null;
  errors: Record<string, string>;
}>;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** A finite number, rounded down. */
function int(value: unknown): number | undefined {
  const n = num(value);
  return n === undefined ? undefined : Math.floor(n);
}

function bool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

/** A resolved bound label → its text; a reference left unresolved → nothing. */
function labelOf(value: unknown): string | undefined {
  if (isSlotRef(value) || isRecordRef(value)) return undefined;
  return typeof value === 'string' ? value : undefined;
}

/** A record field's value as a title: a string or a number, else empty. */
function titleOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function recordsOf(source: unknown): ResolvedRecord[] {
  return isResolvedCollection(source) ? source.records : [];
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * The def of a scope from its RESOLVED props (`resolveDoc` turned every
 * `{ $collection }` into its records and every bound label into its text).
 * Pure; read defensively, since stored props were never validated. Shared by
 * the render pass and the scope block's shell.
 */
export function scopeDefOf(props: Record<string, unknown>, id: string): ScopeDef {
  const currencyRaw = str(props.currency)?.toUpperCase();
  const currency = currencyRaw && /^[A-Z]{3}$/.test(currencyRaw) ? currencyRaw : null;
  const catalog: Record<string, CatalogEntry> = {};
  let catalogSize = 0;

  /* A collection's records into the catalog (first come, up to the cap);
     returns the ids this field may name. */
  const fromCollection = (
    source: unknown,
    titleField: string,
    priceField: string | undefined
  ): string[] => {
    const ids: string[] = [];
    for (const record of recordsOf(source)) {
      if (!(record.id in catalog)) {
        if (catalogSize >= CATALOG_MAX) continue;
        catalog[record.id] = {
          title: titleOf(record.data[titleField]),
          price: priceField ? priceOf(record.data[priceField], currency) : null,
        };
        catalogSize += 1;
      }
      ids.push(record.id);
    }
    return ids;
  };

  const fields: ScopeDefField[] = [];
  const seen = new Set<string>();
  for (const raw of Array.isArray(props.fields) ? props.fields : []) {
    if (!isRecord(raw)) continue;
    const fieldKey = str(raw.key);
    if (!fieldKey || !scopeKeySchema.safeParse(fieldKey).success || seen.has(fieldKey)) continue;
    seen.add(fieldKey);
    const common: DefBase = {
      key: fieldKey,
      ...(labelOf(raw.label) !== undefined ? { label: labelOf(raw.label) } : {}),
      ...(raw.required === true ? { required: true } : {}),
      ...(str(raw.onStep) ? { onStep: str(raw.onStep) } : {}),
    };
    const fromQuery = str(raw.fromQuery);
    const query = fromQuery ? { fromQuery } : {};
    switch (raw.type) {
      case 'number':
        fields.push({
          ...common,
          type: 'number',
          ...(num(raw.default) !== undefined ? { default: num(raw.default) } : {}),
          ...(num(raw.min) !== undefined ? { min: num(raw.min) } : {}),
          ...(num(raw.max) !== undefined ? { max: num(raw.max) } : {}),
          ...((num(raw.increment) ?? 0) > 0 ? { increment: num(raw.increment) } : {}),
          ...query,
        });
        break;
      case 'text':
        fields.push({
          ...common,
          type: 'text',
          ...(str(raw.default) !== undefined ? { default: str(raw.default) } : {}),
          ...(int(raw.maxLength) !== undefined
            ? { maxLength: Math.min(500, Math.max(0, int(raw.maxLength) ?? 0)) }
            : {}),
          ...query,
        });
        break;
      case 'boolean':
        fields.push({
          ...common,
          type: 'boolean',
          ...(bool(raw.default) !== undefined ? { default: bool(raw.default) } : {}),
        });
        break;
      case 'choice': {
        let options: Array<{ value: string; label: string }> = [];
        if (Array.isArray(raw.options)) {
          options = raw.options.flatMap((option) =>
            isRecord(option) && typeof option.value === 'string'
              ? [{ value: option.value, label: labelOf(option.label) ?? option.value }]
              : []
          );
        } else if (isRecord(raw.options)) {
          const titleField = str(raw.options.titleField) ?? '';
          const ids = fromCollection(raw.options.source, titleField, str(raw.options.priceField));
          options = ids.map((recordId) => ({
            value: recordId,
            label: catalog[recordId]?.title ?? '',
          }));
        }
        fields.push({
          ...common,
          type: 'choice',
          options,
          ...(str(raw.default) !== undefined ? { default: str(raw.default) } : {}),
          ...query,
        });
        break;
      }
      case 'date': {
        const min = str(raw.min);
        fields.push({
          ...common,
          type: 'date',
          ...(min === 'today' || (min && isoDateSchema.safeParse(min).success) ? { min } : {}),
          ...query,
        });
        break;
      }
      case 'dateRange': {
        const q = isRecord(raw.fromQuery) ? raw.fromQuery : null;
        const [qFrom, qTo] = [str(q?.from), str(q?.to)];
        const [minNights, maxNights] = [int(raw.minNights), int(raw.maxNights)];
        fields.push({
          ...common,
          type: 'dateRange',
          ...(raw.min === 'today' ? { min: 'today' as const } : {}),
          ...(minNights !== undefined ? { minNights } : {}),
          ...(maxNights !== undefined ? { maxNights } : {}),
          ...(qFrom && qTo ? { fromQuery: { from: qFrom, to: qTo } } : {}),
        });
        break;
      }
      case 'quantities': {
        const items = fromCollection(raw.source, str(raw.titleField) ?? '', str(raw.priceField));
        const max = num(raw.max);
        fields.push({
          ...common,
          type: 'quantities',
          items,
          ...(max !== undefined
            ? { max: Math.min(QUANTITY_MAX, Math.max(0, Math.floor(max))) }
            : {}),
        });
        break;
      }
      default:
        break;
    }
    if (fields.length >= 24) break;
  }

  const steps = (Array.isArray(props.steps) ? props.steps : [])
    .flatMap((step) => {
      if (!isRecord(step)) return [];
      const stepId = str(step.id);
      return stepId ? [{ id: stepId, label: labelOf(step.label) ?? stepId }] : [];
    })
    .slice(0, 8);

  const derived = (Array.isArray(props.derived) ? props.derived : [])
    .flatMap((entry) => {
      const parsed = derivedSchema.safeParse(entry);
      return parsed.success ? [parsed.data] : [];
    })
    .slice(0, 16);

  return {
    id,
    fields,
    steps,
    derived,
    currency,
    persist: props.persist === 'none' ? 'none' : 'session',
    catalog,
  };
}
