/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { BoundMeta, FieldType, ResolvedCollection } from '../../contracts';

import { boundSchema, collectionSourceSchema, floatingSlotSchema } from '../../contracts';
import { styleProps } from '../style-props';

/** What a click on the canvas can pick inside a listing — each styleable. */
export const LISTINGS_ELEMENTS = ['title', 'cards'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/** What a card can print as text (`readString`). */
const TEXT_FIELD_TYPES: FieldType[] = [
  'text',
  'slug',
  'email',
  'select',
  'date',
  'number',
  'phone',
  'country',
];

/**
 * One field key of the bound collection, of a type the card can draw: the
 * Design inspector offers the collection's fields of those types.
 */
export function collectionFieldKey(fieldTypes: FieldType[]) {
  return z
    .string()
    .describe('A field key of the bound collection (list_collections), or "" for none.')
    .meta({ hl: 'fieldKey', fieldTypes } satisfies BoundMeta);
}

export const listingMappingSchema = z.object({
  titleField: collectionFieldKey(TEXT_FIELD_TYPES),
  imageField: collectionFieldKey(['media']),
  metaField: collectionFieldKey(TEXT_FIELD_TYPES),
  priceField: collectionFieldKey(['number', 'text', 'money']),
  /** The fallback link for a collection with no template page (CB-h). */
  hrefTemplate: z.string(),
});

export const listingsSchema = z.object({
  source: collectionSourceSchema.nullable(),
  title: boundSchema(z.string()),
  layout: z.enum(['grid', 'rows', 'carousel']),
  limit: z.number().int().min(3).max(12),
  showPrice: z.boolean(),
  mapping: listingMappingSchema,
  ...styleProps(LISTINGS_ELEMENTS),
  /** Free elements drawn over the listing (`floating` blocks). */
  floating: floatingSlotSchema,
});
export type ListingsStoredProps = z.infer<typeof listingsSchema>;
export type ListingsProps = Omit<ListingsStoredProps, 'source'> & {
  source: ListingsStoredProps['source'] | ResolvedCollection;
};
