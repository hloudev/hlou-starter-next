/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import {
  boundMediaSchema,
  boundSchema,
  floatingSlotSchema,
  resolvedMediaSchema,
  richTextDocSchema,
} from '../../contracts';
import {
  alignSchema,
  itemStyleSchema,
  responsiveAspectSchema,
  responsiveGapSchema,
  styleProps,
} from '../style-props';

/** What a click on the canvas can pick inside a hero — each styleable. */
export const HERO_ELEMENTS = ['eyebrow', 'title', 'description', 'buttons', 'image'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const heroButtonSchema = z.object({
  label: boundSchema(z.string()),
  href: z.string(),
  variant: z.enum(['primary', 'ghost']),
  style: itemStyleSchema,
});
export type HeroButton = z.infer<typeof heroButtonSchema>;

export const heroSchema = z.object({
  image: boundMediaSchema().nullable(),
  eyebrow: boundSchema(z.string()),
  title: boundSchema(z.string()),
  description: boundSchema(richTextDocSchema),
  buttons: z.array(heroButtonSchema),
  /** `end` is new — `start`/`center` only used to cover the vocabulary. */
  align: alignSchema,
  /** Between the copy column and the image. */
  gap: responsiveGapSchema,
  mediaRatio: responsiveAspectSchema,
  /** Where the image sits (M29): beside the copy (end or start), under it, or behind it as a full-bleed background. */
  layout: z.enum(['split-end', 'split-start', 'stacked', 'overlay']).optional(),
  mediaFit: z.enum(['cover', 'contain']).optional(),
  /**
   * More images after `image` (M40-08): the figure becomes a slideshow that
   * cross-fades from one to the next — in every layout. `image` stays the
   * first, so a bound image keeps working. Items, not bare media: the
   * inspector draws a media picker per item.
   */
  slides: z
    .array(z.object({ media: resolvedMediaSchema.nullable() }))
    .max(5)
    .optional(),
  /** Seconds between slides, 0 = off; 6 when absent. Never under reduced motion. */
  autoplay: z.number().int().min(0).max(15).optional(),
  ...styleProps(HERO_ELEMENTS),
  /** Free elements drawn over the hero (`floating` blocks). */
  floating: floatingSlotSchema,
});
export type HeroProps = z.infer<typeof heroSchema>;
