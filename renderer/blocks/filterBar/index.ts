/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { FilterBarProps } from './schema';
import { FilterBarBlock } from './Component';
import { filterBarDefaults } from './defaults';
import { filterBarDesign } from './design';
import { filterBarSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const filterBarBlock: BlockDefinition<typeof filterBarSchema, FilterBarProps> = {
  key: 'filterBar',
  label: 'filterBar',
  category: 'library',
  ...filterBarDesign,
  schema: filterBarSchema,
  defaults: filterBarDefaults,
  Component: FilterBarBlock,
  bindable: [],
  collectionProps: ['source'],
};

export { filterBarSchema, filterBarDefaults, FilterBarBlock };
export type { FilterBarProps };
