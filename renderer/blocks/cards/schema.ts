/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import {
  boundSchema,
  floatingSlotSchema,
  longTextSchema,
  resolvedMediaSchema,
} from '../../contracts';
import {
  alignSchema,
  iconSchema,
  itemStyleSchema,
  responsiveSchema,
  styleProps,
} from '../style-props';

/** What a click on the canvas can pick inside a cards block — each styleable. */
export const CARDS_ELEMENTS = ['title', 'items'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const cardItemSchema = z.object({
  media: resolvedMediaSchema.nullable(),
  icon: iconSchema,
  eyebrow: boundSchema(z.string()),
  title: boundSchema(z.string()),
  text: boundSchema(longTextSchema),
  href: z.string(),
  /** A link label under the text; empty makes the whole card the link when `href` is set. */
  buttonLabel: boundSchema(z.string()),
  style: itemStyleSchema,
});
export type CardItem = z.infer<typeof cardItemSchema>;

/**
 * A grid of cards (M29): services, team, values, steps, pricing-lite — each
 * with an optional image or icon, an eyebrow, a title, a text and a link.
 * The general-purpose section a « Why choose us » row and most brand
 * sites need; `featureGrid` stays the compact icon-only version.
 */
export const cardsSchema = z.object({
  title: boundSchema(z.string()),
  titleAlign: alignSchema,
  items: z.array(cardItemSchema),
  /** Columns per breakpoint, 1–4. */
  columns: responsiveSchema(z.number().int().min(1).max(4), 'columns'),
  variant: z.enum(['plain', 'bordered', 'elevated', 'image-top', 'image-bg']),
  /** Text alignment inside each card. */
  align: z.enum(['start', 'center']),
  ...styleProps(CARDS_ELEMENTS),
  /** Free elements drawn over the grid (`floating` blocks). */
  floating: floatingSlotSchema,
});
export type CardsProps = z.infer<typeof cardsSchema>;
