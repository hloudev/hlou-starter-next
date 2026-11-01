/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { TableProps } from './schema';
import { TableBlock } from './Component';
import { tableDefaults } from './defaults';
import { tableSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const tableBlock: BlockDefinition<typeof tableSchema, TableProps> = {
  key: 'table',
  label: 'table',
  category: 'blocks',
  schema: tableSchema,
  defaults: tableDefaults,
  Component: TableBlock,
  bindable: [],
};

export { tableSchema, tableDefaults, TableBlock };
export type { TableProps };
