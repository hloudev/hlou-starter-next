/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundMediaSchema, boundSchema } from '../../contracts';
import { styleProps } from '../style-props';
import { SURFACE_POSITIONS } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const imageSchema = z.object({
  media: boundMediaSchema().nullable(),
  /** Overrides the asset's own alt; empty falls back to it. */
  alt: boundSchema(z.string()),
  caption: boundSchema(z.string()),
  ratio: z.enum(['auto', 'square', 'landscape', 'portrait', 'wide']),
  fit: z.enum(['cover', 'contain']),
  /** Which part of the image stays in view when it is cropped. */
  position: z.enum(SURFACE_POSITIONS).optional(),
  width: z.enum(['narrow', 'wide', 'full']),
  rounded: z.boolean(),
  ...styleProps(['media', 'caption']),
});
export type ImageProps = z.infer<typeof imageSchema>;
