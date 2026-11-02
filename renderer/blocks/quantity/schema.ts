/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { BoundMeta } from '../../contracts';

import { boundSchema, collectionSourceSchema } from '../../contracts';
import { collectionFieldKey } from '../listings/schema';
import { styleProps } from '../style-props';

/** What a click on the canvas can pick inside a quantity block — each styleable. */
export const QUANTITY_ELEMENTS = ['label', 'hint', 'control', 'rows', 'price'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/** A path in the nearest scope: the state bar's picker (C1) edits it. */
export const statePathSchema = z
  .string()
  .describe('A field key of the nearest scope (or `field.recordId`).')
  .meta({ hl: 'statePath' } satisfies BoundMeta);

/**
 * How a widget presents a collection's records beyond the scope's catalog
 * (`{ title, price }`): the block's own `source` — the same collection —
 * joined by record id. Presentation only; the scope stays the authority for
 * the value and the price.
 */
export const optionMappingSchema = z.object({
  imageField: collectionFieldKey(['media']),
  metaField: collectionFieldKey(['text', 'select', 'number', 'date']),
  /** A text field holding an icon name (`tree`, `camera`…), or a media field (an SVG). */
  iconField: collectionFieldKey(['text', 'select', 'media']),
});
export type OptionMapping = z.infer<typeof optionMappingSchema>;

/**
 * A quantity: steppers « − 2 + » on a scope value. What it draws
 * follows the bound field — a `number` → one stepper; a `quantities` field
 * with `key` → one stepper for that record; without `key` → the list, one
 * row per catalog record (the extras list).
 */
export const quantitySchema = z.object({
  bind: z
    .object({
      path: statePathSchema,
      /** A record id of a `quantities` field: one stepper for it. */
      key: z.string().optional(),
    })
    .nullable(),
  /** Empty: the field's label, or the record's title. */
  label: boundSchema(z.string()),
  /** Under the label: « 13 ans et + ». */
  hint: boundSchema(z.string()),
  showPrice: z.boolean(),
  /** Beside a unit price: « / personne ». */
  unitLabel: boundSchema(z.string()),
  /** The same collection as the field's, for each row's icon, photo or meta. */
  source: collectionSourceSchema.nullable(),
  mapping: optionMappingSchema,
  ...styleProps(QUANTITY_ELEMENTS),
});
export type QuantityProps = z.infer<typeof quantitySchema>;
