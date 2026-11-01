/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const spacerSchema = z.object({
  height: z.number().int().min(8).max(200),
  ...styleProps([]),
});
export type SpacerProps = z.infer<typeof spacerSchema>;
