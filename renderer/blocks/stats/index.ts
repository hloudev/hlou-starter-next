/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { StatsProps } from './schema';
import { StatsBlock } from './Component';
import { statsDefaults } from './defaults';
import { statsDesign } from './design';
import { statsSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const statsBlock: BlockDefinition<typeof statsSchema, StatsProps> = {
  key: 'stats',
  label: 'stats',
  category: 'library',
  ...statsDesign,
  schema: statsSchema,
  defaults: statsDefaults,
  Component: StatsBlock,
  bindable: [],
};

export { statsSchema, statsDefaults, StatsBlock };
export type { StatsProps };
