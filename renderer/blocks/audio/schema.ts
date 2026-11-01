/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundMediaSchema, boundSchema } from '../../contracts';
import { styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/**
 * A library audio file (M37-06, decision 188 §9): the player always shows
 * its controls and never starts on its own — no autoplay prop at all.
 */
export const audioSchema = z.object({
  media: boundMediaSchema().nullable(),
  title: boundSchema(z.string()),
  caption: boundSchema(z.string()),
  loop: z.boolean(),
  ...styleProps(['media', 'title', 'caption']),
});
export type AudioProps = z.infer<typeof audioSchema>;
