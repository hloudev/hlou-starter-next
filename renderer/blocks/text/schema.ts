/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema, richTextDocSchema } from '../../contracts';
import { styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const textSchema = z.object({
  body: boundSchema(richTextDocSchema),
  align: z.enum(['start', 'center']),
  width: z.enum(['narrow', 'wide']),
  ...styleProps(['body']),
});
export type TextProps = z.infer<typeof textSchema>;
