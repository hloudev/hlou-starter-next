/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundMediaSchema, boundSchema } from '../../contracts';
import { styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const videoSchema = z.object({
  /** A library video (M37-06): wins over `url` when set. */
  media: boundMediaSchema().nullable().optional(),
  /** A YouTube / Vimeo link, or a direct file over https. */
  url: z.string(),
  title: boundSchema(z.string()),
  ratio: z.enum(['wide', 'square', 'portrait']),
  width: z.enum(['narrow', 'wide', 'full']),
  ...styleProps(['url']),
});
export type VideoProps = z.infer<typeof videoSchema>;
