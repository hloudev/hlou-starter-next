/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema } from '../../contracts';
import { itemStyleSchema, styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const tableCellSchema = z.object({ text: boundSchema(z.string()), style: itemStyleSchema });

export const tableRowSchema = z.object({
  cells: z.array(tableCellSchema),
  style: itemStyleSchema,
});

export const tableSchema = z.object({
  caption: boundSchema(z.string()),
  head: z.array(tableCellSchema),
  rows: z.array(tableRowSchema),
  striped: z.boolean(),
  compact: z.boolean(),
  ...styleProps(['head', 'rows', 'cells', 'caption']),
});
export type TableProps = z.infer<typeof tableSchema>;
