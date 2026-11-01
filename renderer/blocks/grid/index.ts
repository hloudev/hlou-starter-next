/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { GridProps } from './schema';
import { GridBlock } from './Component';
import { gridDefaults } from './defaults';
import { GRID_COLUMN_KEYS, gridSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const gridBlock: BlockDefinition<typeof gridSchema, GridProps> = {
  key: 'grid',
  label: 'grid',
  category: 'layout',
  schema: gridSchema,
  defaults: gridDefaults,
  Component: GridBlock,
  bindable: [],
};

export { gridSchema, gridDefaults, GridBlock, GRID_COLUMN_KEYS };
export type { GridProps };
