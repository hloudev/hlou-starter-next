/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema, resolvedMediaSchema } from '../../contracts';
import { itemStyleSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside a marquee — each styleable. */
export const MARQUEE_ELEMENTS = ['items'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const marqueeItemSchema = z.object({
  text: boundSchema(z.string()),
  media: resolvedMediaSchema.nullable(),
  style: itemStyleSchema,
});
export type MarqueeItem = z.infer<typeof marqueeItemSchema>;

/**
 * A line that scrolls by itself (M29): words, logos, a strip of images — the
 * creative-site staple. CSS only; a visitor who asked for less motion sees
 * the items wrapped and still.
 */
export const marqueeSchema = z.object({
  items: z.array(marqueeItemSchema),
  speed: z.enum(['slow', 'base', 'fast']),
  direction: z.enum(['start', 'end']),
  pauseOnHover: z.boolean(),
  /** Drawn between items; empty for none. */
  separator: z.string().max(4),
  size: z.enum(['sm', 'md', 'lg']),
  ...styleProps(MARQUEE_ELEMENTS),
});
export type MarqueeProps = z.infer<typeof marqueeSchema>;
