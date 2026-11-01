/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { ListProps } from './schema';
import { ListBlock } from './Component';
import { listDefaults } from './defaults';
import { listSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const listBlock: BlockDefinition<typeof listSchema, ListProps> = {
  key: 'list',
  label: 'list',
  category: 'blocks',
  schema: listSchema,
  defaults: listDefaults,
  Component: ListBlock,
  bindable: [],
};

export { listSchema, listDefaults, ListBlock };
export type { ListProps };
