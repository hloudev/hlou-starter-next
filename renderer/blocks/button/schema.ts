/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { stateBoundSchema } from '../../contracts';
import { actionSchema } from '../../state/schema';
import { iconSchema, styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/** `ink`, `outline` and `link` are M29: a dark pill, a hairline outline, a text link. */
export const buttonVariantSchema = z.enum(['primary', 'ghost', 'paper', 'ink', 'outline', 'link']);
export const buttonSizeSchema = z.enum(['sm', 'md', 'lg']);

export const buttonSchema = z.object({
  /* May show a scope value (decision 197). */
  label: stateBoundSchema(z.string()),
  href: z.string(),
  /**
   * What a click does inside a scope (decision 197): with one set, the button
   * is a `<button type="button">` and `href` is ignored.
   */
  action: actionSchema.meta({ hl: 'action' }).optional(),
  variant: buttonVariantSchema,
  size: buttonSizeSchema.optional(),
  /** An icon beside the label (M29). */
  icon: iconSchema.optional(),
  iconPosition: z.enum(['start', 'end']).optional(),
  align: z.enum(['start', 'center', 'end']),
  ...styleProps(['label']),
});
export type ButtonProps = z.infer<typeof buttonSchema>;
