/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { ReactElement } from 'react';
import type { BoundMeta, FieldType, ResponsiveControl } from '../contracts';
import type { CustomField, CustomFieldScope, SiteField } from './types';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type CustomFieldKind =
  | 'slotRef'
  | 'collectionRef'
  | 'formRef'
  | 'collectionField'
  | 'richtext'
  | 'media'
  | 'json'
  | 'color'
  | 'font'
  | 'responsive'
  | 'position'
  | 'style'
  | 'elements'
  /* A scope's fields, steps and derived values, a button's action, a path
     into the nearest scope (decision 197; editors in M40-18). */
  | 'scopeFields'
  | 'scopeSteps'
  | 'scopeDerived'
  | 'action'
  | 'statePath';

export type CustomFieldRenderProps = {
  kind: CustomFieldKind;
  id: string;
  name: string;
  label?: string;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  /** For `slotRef`: the field that edits the literal while the prop is unbound. */
  literalField?: SiteField;
  /** For `responsive`: what one breakpoint's value is (`blocks/tw.ts`). */
  control?: ResponsiveControl;
  /** For `elements`: the block's styleable element names. */
  elements?: string[];
  /** For `collectionField`: the field types of the bound collection it may name. */
  fieldTypes?: FieldType[];
  /** For `slotRef`: the prop also takes a `{ $state }` value of the nearest scope. */
  state?: boolean;
  /** The parcours the edited node is in, or is (M40-18): set by the inspector, never by a schema. */
  scope?: CustomFieldScope;
};

export type CustomFieldRenderer = (props: CustomFieldRenderProps) => ReactElement;

export type CustomFieldRenderers = Record<CustomFieldKind, CustomFieldRenderer>;

type Unwrapped = {
  core: z.ZodType;
  defaultValue: unknown;
  nullable: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Site chrome never nests inside a layout block; a free element lives only in
 * a floating layer.
 */
export const SLOT_DISALLOWED = ['header', 'footer', 'floating'] as const;

/** A floating layer holds free elements and nothing else. */
export const FLOATING_SLOT_ALLOWED = ['floating'] as const;

/** `ctaLabel` → `Cta label`, `hrefTemplate` → `Href template`. */
export function humanize(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function readMeta(schema: z.ZodType): BoundMeta['hl'] | undefined {
  const meta = schema.meta();
  const hl = meta && typeof meta === 'object' ? (meta as Record<string, unknown>).hl : undefined;
  return typeof hl === 'string' ? (hl as BoundMeta['hl']) : undefined;
}

function readControl(schema: z.ZodType): ResponsiveControl | undefined {
  const meta = schema.meta();
  const control =
    meta && typeof meta === 'object' ? (meta as Record<string, unknown>).control : undefined;
  return control === 'gap' || control === 'aspect' ? control : undefined;
}

function readFieldTypes(schema: z.ZodType): FieldType[] | undefined {
  const meta = schema.meta();
  const types =
    meta && typeof meta === 'object' ? (meta as Record<string, unknown>).fieldTypes : undefined;
  return Array.isArray(types)
    ? types.filter((type): type is FieldType => typeof type === 'string')
    : undefined;
}

/** For a `slot`: the types it refuses on top of `SLOT_DISALLOWED`. */
function readDisallow(schema: z.ZodType): string[] {
  const meta = schema.meta();
  const disallow =
    meta && typeof meta === 'object' ? (meta as Record<string, unknown>).disallow : undefined;
  return Array.isArray(disallow)
    ? disallow.filter((type): type is string => typeof type === 'string')
    : [];
}

function readElements(schema: z.ZodType): string[] {
  const meta = schema.meta();
  const elements =
    meta && typeof meta === 'object' ? (meta as Record<string, unknown>).elements : undefined;
  return Array.isArray(elements)
    ? elements.filter((name): name is string => typeof name === 'string')
    : [];
}

/**
 * zod v4 types a wrapper's `innerType` as the core `$ZodType`; every schema
 * built through `z.*` is the classic class, which is what introspection needs.
 */
function asClassic(schema: unknown): z.ZodType {
  if (schema instanceof z.ZodType) return schema;
  throw new Error('Expected a zod schema built with `z.*`');
}

/** Strip `.default()`, `.optional()`, `.nullable()`, `.catch()`, `.readonly()`. */
function unwrap(schema: z.ZodType): Unwrapped {
  let core: z.ZodType = schema;
  let defaultValue: unknown;
  let nullable = false;
  for (;;) {
    if (core instanceof z.ZodDefault) {
      defaultValue = core.def.defaultValue;
      core = asClassic(core.def.innerType);
    } else if (
      core instanceof z.ZodCatch ||
      core instanceof z.ZodOptional ||
      core instanceof z.ZodReadonly
    ) {
      core = asClassic(core.def.innerType);
    } else if (core instanceof z.ZodNullable) {
      nullable = true;
      core = asClassic(core.def.innerType);
    } else {
      return { core, defaultValue, nullable };
    }
  }
}

/** A prop schema's `hl` meta, through its `.default()` / `.optional()` / … wrappers. */
export function propMeta(schema: z.ZodType): BoundMeta['hl'] | undefined {
  return readMeta(unwrap(schema).core);
}

function literalOptions(
  schema: z.ZodType
): Array<{ label: string; value: string | number | boolean }> | null {
  if (schema instanceof z.ZodEnum) {
    return schema.options.map((value) => ({ label: String(value), value }));
  }
  if (schema instanceof z.ZodUnion) {
    const options: Array<{ label: string; value: string | number | boolean }> = [];
    for (const option of schema.options) {
      if (!(option instanceof z.ZodLiteral)) return null;
      for (const value of option.values) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          options.push({ label: String(value), value });
        } else {
          return null;
        }
      }
    }
    return options;
  }
  return null;
}

type CustomFieldExtras = Pick<
  CustomFieldRenderProps,
  'literalField' | 'control' | 'elements' | 'fieldTypes' | 'state'
>;

function customField(
  kind: CustomFieldKind,
  label: string,
  renderers: CustomFieldRenderers,
  { literalField, control, elements, fieldTypes, state }: CustomFieldExtras = {}
): CustomField {
  const renderer = renderers[kind];
  return {
    type: 'custom',
    label,
    metadata: {
      hlKind: kind,
      /* For `slotRef`: what the prop holds while unbound, readable without rendering. */
      ...(literalField ? { hlLiteral: literalField } : {}),
      ...(control ? { hlControl: control } : {}),
      ...(elements ? { hlElements: elements } : {}),
      ...(fieldTypes ? { hlFieldTypes: fieldTypes } : {}),
      ...(state ? { hlState: true } : {}),
    },
    /* The label is read from the field handed over at render time, not the
       one captured here: a consumer that rewrites labels (the Design
       inspector translates them) does so on the field object. */
    render: ({ field, id, name, value, onChange, readOnly, scope }) =>
      renderer({
        kind,
        id,
        name,
        label: field.label ?? label,
        value,
        onChange,
        readOnly,
        literalField,
        control,
        elements,
        fieldTypes,
        ...(state ? { state } : {}),
        ...(scope ? { scope } : {}),
      }),
  };
}

/** For `bound`: whether the union also takes `{ $state }` (`stateBoundSchema`). */
function readState(schema: z.ZodType): boolean {
  const meta = schema.meta();
  return (
    meta !== undefined &&
    typeof meta === 'object' &&
    (meta as Record<string, unknown>).state === true
  );
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * One zod prop → one field. Bound props, collection / form sources and
 * their field keys, rich text and media become `custom` fields whose renderer the app can
 * override; everything else is a plain field type (`config/types.ts`).
 */
export function zodToField(
  schema: z.ZodType,
  label: string,
  renderers: CustomFieldRenderers
): SiteField {
  const { core } = unwrap(schema);
  const meta = readMeta(core);

  if (meta === 'bound' && core instanceof z.ZodUnion) {
    const literal = core.options[0];
    const literalField = literal ? zodToField(asClassic(literal), label, renderers) : undefined;
    return customField('slotRef', label, renderers, {
      literalField,
      ...(readState(core) ? { state: true } : {}),
    });
  }
  if (meta === 'scopeFields') return customField('scopeFields', label, renderers);
  if (meta === 'scopeSteps') return customField('scopeSteps', label, renderers);
  if (meta === 'scopeDerived') return customField('scopeDerived', label, renderers);
  if (meta === 'action') return customField('action', label, renderers);
  if (meta === 'statePath') return customField('statePath', label, renderers);
  if (meta === 'collection') return customField('collectionRef', label, renderers);
  if (meta === 'form') return customField('formRef', label, renderers);
  if (meta === 'fieldKey') {
    return customField('collectionField', label, renderers, { fieldTypes: readFieldTypes(core) });
  }
  if (meta === 'richtext') return customField('richtext', label, renderers);
  if (meta === 'media') return customField('media', label, renderers);
  if (meta === 'longtext') return { type: 'textarea', label };
  if (meta === 'slot') {
    return { type: 'slot', label, disallow: [...SLOT_DISALLOWED, ...readDisallow(core)] };
  }
  if (meta === 'color') return customField('color', label, renderers);
  if (meta === 'font') return customField('font', label, renderers);
  if (meta === 'responsive') {
    return customField('responsive', label, renderers, { control: readControl(core) });
  }
  if (meta === 'position') return customField('position', label, renderers);
  if (meta === 'style') return customField('style', label, renderers);
  if (meta === 'elements') {
    return customField('elements', label, renderers, { elements: readElements(core) });
  }
  if (meta === 'floatingSlot') {
    return { type: 'slot', label, allow: [...FLOATING_SLOT_ALLOWED] };
  }

  if (core instanceof z.ZodString) return { type: 'text', label };
  if (core instanceof z.ZodNumber) {
    return {
      type: 'number',
      label,
      min: core.minValue ?? undefined,
      max: core.maxValue ?? undefined,
      step: core.isInt ? 1 : undefined,
    };
  }
  if (core instanceof z.ZodBoolean) {
    return {
      type: 'radio',
      label,
      /* Keys, not copy: the Design inspector translates `yes` / `no`. */
      options: [
        { label: 'yes', value: true },
        { label: 'no', value: false },
      ],
    };
  }

  const options = literalOptions(core);
  if (options) {
    return options.length <= 3
      ? { type: 'radio', label, options }
      : { type: 'select', label, options };
  }

  if (core instanceof z.ZodArray) {
    const element = unwrap(asClassic(core.element)).core;
    if (element instanceof z.ZodObject) {
      return {
        type: 'array',
        label,
        /* An item's own `style` is edited from its Style tab, not the list. */
        arrayFields: omitStyleFields(zodObjectToFields(element, renderers)),
        getItemSummary: (item: Record<string, unknown>, index?: number) =>
          summarise(item) ?? `${label} ${(index ?? 0) + 1}`,
      };
    }
    return customField('json', label, renderers);
  }

  if (core instanceof z.ZodObject) {
    return { type: 'object', label, objectFields: zodObjectToFields(core, renderers) };
  }

  return customField('json', label, renderers);
}

/**
 * Every field's `label` is its PROP NAME and every option's `label` its raw
 * value: keys for the consumer to translate (the Design inspector reads
 * `Design.fields.<name>` / `Design.options.<value>`), never copy. The
 * standalone editors in `default-fields.tsx` humanise them for the case
 * where the renderer runs alone.
 */
export function zodObjectToFields(
  schema: z.ZodObject,
  renderers: CustomFieldRenderers
): Record<string, SiteField> {
  const fields: Record<string, SiteField> = {};
  for (const [key, prop] of Object.entries(schema.shape)) {
    /* Set by code (the agent, a developer) or the document, never typed in the inspector. */
    const meta = readMeta(unwrap(asClassic(prop)).core);
    if (meta === 'codeVariant' || meta === 'internal') continue;
    fields[key] = zodToField(asClassic(prop), key, renderers);
  }
  return fields;
}

/** Drops the `style` custom fields from a field map (an item's own style). */
function omitStyleFields(fields: Record<string, SiteField>): Record<string, SiteField> {
  return Object.fromEntries(
    Object.entries(fields).filter(
      ([, field]) => (field.metadata as { hlKind?: unknown } | undefined)?.hlKind !== 'style'
    )
  );
}

/**
 * The top-level props of a block schema that hold a font (`meta({ hl: 'font' })`)
 * — what a count of "blocks using this font level" has to look at.
 */
export function fontPropNames(schema: z.ZodObject): string[] {
  return Object.entries(schema.shape)
    .filter(([, prop]) => readMeta(unwrap(asClassic(prop)).core) === 'font')
    .map(([key]) => key);
}

/** First string-ish value of an array item, for a list's collapsed row label. */
function summarise(item: Record<string, unknown>): string | undefined {
  for (const key of ['label', 'title', 'heading', 'value']) {
    const value = item[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}
