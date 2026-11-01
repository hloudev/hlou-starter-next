/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { slotContentSchema } from '../../contracts';
import { styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const GRID_COLUMN_KEYS = ['column1', 'column2', 'column3', 'column4'] as const;
export type GridColumnKey = (typeof GRID_COLUMN_KEYS)[number];

/** Column templates (M29), from the tablet up; `equal` follows `columns`. */
export const GRID_TEMPLATES = ['equal', '2-1', '1-2', '3-1', '1-3', 'auto-1', '1-auto'] as const;

export const gridSchema = z.object({
  /** Columns from the desktop up (and the tablet unless `columnsMd` says otherwise). */
  columns: z.number().int().min(1).max(4),
  /** Columns on a phone (M29): one, or two for small tiles. */
  columnsBase: z.enum(['1', '2']).optional(),
  /** Columns on a tablet (M29); defaults to `columns`. */
  columnsMd: z.number().int().min(1).max(4).optional(),
  /** Unequal columns (M29): media first. Overrides `columns` from the tablet up. */
  template: z.enum(GRID_TEMPLATES).optional(),
  gap: z.enum(['tight', 'base', 'roomy']),
  rowGap: z.enum(['tight', 'base', 'roomy']).optional(),
  align: z.enum(['start', 'center', 'stretch']),
  justify: z.enum(['start', 'center', 'end']).optional(),
  column1: slotContentSchema,
  column2: slotContentSchema,
  column3: slotContentSchema,
  column4: slotContentSchema,
  ...styleProps([]),
});
export type GridProps = z.infer<typeof gridSchema>;
