/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { floatingSlotSchema, slotContentSchema } from '../../contracts';
import { styleProps } from '../style-props';
import { FREE_COLUMN_COUNTS, FREE_ROW_UNITS } from '../tw';

const freeColumnCount = z.enum(FREE_COLUMN_COUNTS).optional();

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const sectionSchema = z.object({
  content: slotContentSchema,
  /** The four paired surface roles: each carries its own foreground pairing
   *  for the blocks inside it (`Component.tsx`), so this stays a closed enum
   *  rather than a free colour — the section's `style.background` is the
   *  free override, painted over the preset's pairing. */
  background: z.enum(['paper', 'well', 'accent', 'ink']),
  width: z.enum(['narrow', 'wide', 'full']),
  ...styleProps([]),
  /**
   * `free`: the content is a column grid and each block sits on it
   * by its node's `place`, per breakpoint (`tw.ts`'s free layout). `stack`,
   * the default, is the slot as it always was.
   */
  layout: z.enum(['stack', 'free']).optional(),
  /** A free grid's columns per breakpoint (12 unless set); the canvas's grid bar edits it. */
  freeColumns: z
    .object({
      base: freeColumnCount,
      md: freeColumnCount,
      lg: freeColumnCount,
      xl: freeColumnCount,
    })
    .meta({ hl: 'internal' })
    .optional(),
  /** A free grid's row module: a spacing step (`FREE_ROW_UNITS`). */
  rowUnit: z
    .enum(Object.keys(FREE_ROW_UNITS) as [keyof typeof FREE_ROW_UNITS])
    .meta({ hl: 'internal' })
    .optional(),
  /** Free elements drawn over the section (`floating` blocks). */
  floating: floatingSlotSchema,
  /**
   * The Structure pattern a planned section was drawn with: what
   * the canvas shows until the section holds something. Kept by the
   * document, not an inspector field.
   */
  glyph: z.string().meta({ hl: 'internal' }).optional(),
});
export type SectionProps = z.infer<typeof sectionSchema>;
