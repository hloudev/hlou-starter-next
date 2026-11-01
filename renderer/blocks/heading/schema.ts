/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { stateBoundSchema } from '../../contracts';
import { ACCENT_DECORATIONS } from '../accent';
import { colorPropSchema, styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const headingSchema = z.object({
  /* May show a scope value (decision 197). */
  text: stateBoundSchema(z.string()),
  level: z.enum(['h1', 'h2', 'h3', 'h4']),
  align: z.enum(['start', 'center', 'end']),
  /** Words set apart (M29), comma- or space-separated; styled through the `accent` element. */
  accentWords: z
    .string()
    .optional()
    .describe(
      'Words to mark, separated by commas: "Vibe, Workspace". Each takes the accent element style and the decoration.'
    ),
  /** Drawn around or under each marked word: a hand-drawn ellipse, a scribble, an underline, a highlight. */
  decoration: z.enum(ACCENT_DECORATIONS).optional(),
  decorationColor: colorPropSchema().optional(),
  ...styleProps(['text', 'accent']),
});
export type HeadingProps = z.infer<typeof headingSchema>;
