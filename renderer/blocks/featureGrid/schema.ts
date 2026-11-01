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
import { alignSchema, colorPropSchema, itemStyleSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside a feature grid — each styleable. */
export const FEATURE_GRID_ELEMENTS = ['title', 'cards'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const featureCardSchema = z.object({
  /** An icon NAME from the set (`get_style_schema` lists them: globe, credit-card, users…) or a glyph/emoji — never a word drawn as text. */
  icon: z
    .string()
    .describe(
      'An icon name from the set (globe, credit-card, users, star…) or an emoji. Use iconMedia for an exported SVG.'
    ),
  /** The icon as an image (M29): an SVG exported from Figma. Wins over `icon`. */
  iconMedia: resolvedMediaSchema.nullable().optional(),
  title: boundSchema(z.string()),
  description: boundSchema(longTextSchema),
  /** Tints the icon glyph and its soft background; unset keeps the accent. */
  iconColor: colorPropSchema().optional(),
  cardBackground: colorPropSchema().optional(),
  style: itemStyleSchema,
});

export const featureGridSchema = z.object({
  title: boundSchema(z.string()),
  titleAlign: alignSchema,
  cards: z.array(featureCardSchema),
  columns: z.number().int().min(1).max(3),
  bordered: z.boolean(),
  ...styleProps(FEATURE_GRID_ELEMENTS),
  /** Free elements drawn over the grid (`floating` blocks). */
  floating: floatingSlotSchema,
});
export type FeatureGridProps = z.infer<typeof featureGridSchema>;
