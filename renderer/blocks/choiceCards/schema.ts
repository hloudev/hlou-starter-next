/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema, collectionSourceSchema, resolvedMediaSchema } from '../../contracts';
import { optionMappingSchema, statePathSchema } from '../quantity/schema';
import { iconSchema, responsiveSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside choice cards — each styleable. */
export const CHOICE_CARDS_ELEMENTS = ['label', 'options'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/** What a static option adds to its card, matched by value. */
export const choiceDecorSchema = z.object({
  value: z.string(),
  description: boundSchema(z.string()),
  badge: boundSchema(z.string()),
  icon: iconSchema.optional(),
  media: resolvedMediaSchema.nullable().optional(),
});
export type ChoiceDecor = z.infer<typeof choiceDecorSchema>;

/**
 * Choice cards (M40-13): one value of a scope's `choice` field, picked among
 * native radios drawn as cards, a segmented control or a list. The options
 * come from the field (static, or the catalog's records with their price).
 */
export const choiceCardsSchema = z.object({
  /** A `choice` field. */
  bind: z.object({ path: statePathSchema }).nullable(),
  /** The fieldset's legend; empty: the field's label. */
  label: boundSchema(z.string()),
  look: z.enum(['cards', 'segmented', 'list']),
  /** Cards per row, by breakpoint (cards only; a phone stacks them). */
  columns: responsiveSchema(z.number().int().min(1).max(4), 'columns'),
  showPrice: z.boolean(),
  /** Static options' description, badge, icon or photo, by value. */
  decor: z.array(choiceDecorSchema).max(12),
  /** The same collection as the field's, for each card's photo, icon or meta. */
  source: collectionSourceSchema.nullable(),
  mapping: optionMappingSchema,
  ...styleProps(CHOICE_CARDS_ELEMENTS),
});
export type ChoiceCardsProps = z.infer<typeof choiceCardsSchema>;
