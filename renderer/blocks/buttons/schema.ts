/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema } from '../../contracts';
import { buttonSizeSchema, buttonVariantSchema } from '../button/schema';
import { iconSchema, itemStyleSchema, styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const buttonItemSchema = z.object({
  label: boundSchema(z.string()),
  href: z.string(),
  variant: buttonVariantSchema,
  size: buttonSizeSchema.optional(),
  icon: iconSchema.optional(),
  iconPosition: z.enum(['start', 'end']).optional(),
  style: itemStyleSchema,
});
export type ButtonItem = z.infer<typeof buttonItemSchema>;

export const buttonsSchema = z.object({
  items: z.array(buttonItemSchema),
  align: z.enum(['start', 'center', 'end']),
  ...styleProps(['items']),
});
export type ButtonsProps = z.infer<typeof buttonsSchema>;
