/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { floatingSlotSchema, stateBoundSchema } from '../../contracts';
import { itemStyleSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside a stats band — each styleable. */
export const STATS_ELEMENTS = ['items'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const statItemSchema = z.object({
  /* Both may show a scope value (decision 197). */
  value: stateBoundSchema(z.string()),
  label: stateBoundSchema(z.string()),
  style: itemStyleSchema,
});

export const statsSchema = z.object({
  items: z.array(statItemSchema),
  rule: z.enum(['none', 'top', 'both']),
  ...styleProps(STATS_ELEMENTS),
  /** Free elements drawn over the band (`floating` blocks). */
  floating: floatingSlotSchema,
});
export type StatsProps = z.infer<typeof statsSchema>;
