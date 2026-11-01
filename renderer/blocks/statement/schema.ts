/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { stateBoundSchema } from '../../contracts';
import { ACCENT_DECORATIONS } from '../accent';
import { colorPropSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside a statement — each styleable. */
export const STATEMENT_ELEMENTS = ['text', 'accent'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/**
 * One oversized sentence (M29): a manifesto line, a studio's one-liner, the
 * typographic moment creative sites open or close on. Marked words take the
 * `accent` element's style and a decoration.
 */
export const statementSchema = z.object({
  /* May show a scope value (decision 197). */
  text: stateBoundSchema(z.string()),
  size: z.enum(['lg', 'xl', '2xl', '3xl']),
  /** Words set apart (comma- or space-separated) — case and accents ignored. */
  accentWords: z
    .string()
    .describe(
      'Words to mark, separated by commas: "lire, écrire". Each takes the accent element style and the decoration.'
    ),
  decoration: z.enum(ACCENT_DECORATIONS),
  decorationColor: colorPropSchema().optional(),
  align: z.enum(['start', 'center', 'end']),
  maxWidth: z.enum(['narrow', 'wide', 'full']),
  ...styleProps(STATEMENT_ELEMENTS),
});
export type StatementProps = z.infer<typeof statementSchema>;
