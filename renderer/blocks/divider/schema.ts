/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const dividerSchema = z.object({
  /** Was `style`, which is now the shared style every block carries. */
  variant: z.enum(['line', 'dashed', 'dots']),
  width: z.enum(['narrow', 'wide', 'full']),
  ...styleProps([]),
});
export type DividerProps = z.infer<typeof dividerSchema>;
