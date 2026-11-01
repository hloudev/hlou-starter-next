/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema } from '../../contracts';
import { buttonVariantSchema } from '../button/schema';
import { styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const themeToggleSchema = z.object({
  /** The button's accessible name — it shows only an icon. */
  label: boundSchema(z.string()),
  variant: buttonVariantSchema,
  align: z.enum(['start', 'center', 'end']),
  ...styleProps(['label']),
});
export type ThemeToggleProps = z.infer<typeof themeToggleSchema>;
