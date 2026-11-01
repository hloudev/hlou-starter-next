/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { slotContentSchema } from '../../contracts';
import { positionSchema, styleSchema } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/**
 * A free element: blocks placed at an absolute position over their host
 * block (a hero's floating layer), dragged there in the canvas.
 */
export const floatingSchema = z.object({
  position: positionSchema,
  /** Its own box: padding, background, radius, shadow — a badge, a card. */
  style: styleSchema,
  content: slotContentSchema,
});
export type FloatingProps = z.infer<typeof floatingSchema>;
