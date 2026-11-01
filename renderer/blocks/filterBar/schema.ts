/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { ResolvedCollection } from '../../contracts';

import { boundSchema, collectionSourceSchema } from '../../contracts';
import { itemStyleSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside a filter bar — each styleable. */
export const FILTER_BAR_ELEMENTS = ['chips', 'countLabel'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const filterChipSchema = z.object({
  label: boundSchema(z.string()),
  style: itemStyleSchema,
});

export const filterBarSchema = z.object({
  chips: z.array(filterChipSchema),
  source: collectionSourceSchema.nullable(),
  sticky: z.boolean(),
  countLabel: boundSchema(z.string()),
  ...styleProps(FILTER_BAR_ELEMENTS),
});
export type FilterBarStoredProps = z.infer<typeof filterBarSchema>;
export type FilterBarProps = Omit<FilterBarStoredProps, 'source'> & {
  source: FilterBarStoredProps['source'] | ResolvedCollection;
};
