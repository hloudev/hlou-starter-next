/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { floatingSlotSchema, slotContentSchema } from '../../contracts';
import { responsiveGapSchema, responsiveSchema, styleProps } from '../style-props';
import { FLEX_DIRECTIONS } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const responsiveDirectionSchema = responsiveSchema(z.enum(FLEX_DIRECTIONS), 'direction');

/**
 * A flex container: the layout block for anything a grid of equal
 * columns is not — a row of unequal items, a column with its own alignment,
 * a header-like bar. Direction and gap are responsive; nested blocks carry
 * their own size through `style` (`width`, `frame`, `classes`).
 */
export const stackSchema = z.object({
  direction: responsiveDirectionSchema,
  wrap: z.boolean(),
  /** Cross-axis alignment of the children. */
  align: z.enum(['start', 'center', 'end', 'stretch']),
  /** Main-axis distribution of the children. */
  justify: z.enum(['start', 'center', 'end', 'between']),
  gap: responsiveGapSchema,
  width: z.enum(['narrow', 'wide', 'full']),
  content: slotContentSchema,
  ...styleProps([]),
  /** Free elements drawn over the stack (`floating` blocks). */
  floating: floatingSlotSchema,
});
export type StackProps = z.infer<typeof stackSchema>;
