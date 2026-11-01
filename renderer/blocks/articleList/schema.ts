/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { ResolvedCollection } from '../../contracts';

import { boundSchema, collectionSourceSchema, floatingSlotSchema } from '../../contracts';
import { listingMappingSchema } from '../listings/schema';
import { styleProps } from '../style-props';

/** What a click on the canvas can pick inside an article list — each styleable. */
export const ARTICLE_LIST_ELEMENTS = ['title', 'rows'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const articleListSchema = z.object({
  source: collectionSourceSchema.nullable(),
  title: boundSchema(z.string()),
  layout: z.enum(['grid', 'rows', 'carousel']),
  limit: z.number().int().min(3).max(12),
  showPrice: z.boolean(),
  mapping: listingMappingSchema,
  ...styleProps(ARTICLE_LIST_ELEMENTS),
  /** Free elements drawn over the list (`floating` blocks). */
  floating: floatingSlotSchema,
});
export type ArticleListStoredProps = z.infer<typeof articleListSchema>;
export type ArticleListProps = Omit<ArticleListStoredProps, 'source'> & {
  source: ArticleListStoredProps['source'] | ResolvedCollection;
};
