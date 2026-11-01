/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema } from '../../contracts';
import { itemStyleSchema, styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const listItemSchema = z.object({ text: boundSchema(z.string()), style: itemStyleSchema });

export const listSchema = z.object({
  items: z.array(listItemSchema),
  /** Was `style`, which is now the shared style every block carries. */
  variant: z.enum(['bullets', 'numbers', 'checks']),
  width: z.enum(['narrow', 'wide']),
  ...styleProps(['items']),
});
export type ListProps = z.infer<typeof listSchema>;
