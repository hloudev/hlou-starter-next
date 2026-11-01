/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { DividerProps } from './schema';
import { DividerBlock } from './Component';
import { dividerDefaults } from './defaults';
import { dividerSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const dividerBlock: BlockDefinition<typeof dividerSchema, DividerProps> = {
  key: 'divider',
  label: 'divider',
  category: 'layout',
  schema: dividerSchema,
  defaults: dividerDefaults,
  Component: DividerBlock,
  bindable: [],
};

export { dividerSchema, dividerDefaults, DividerBlock };
export type { DividerProps };
