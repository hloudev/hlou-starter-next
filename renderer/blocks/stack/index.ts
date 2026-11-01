/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { StackProps } from './schema';
import { StackBlock } from './Component';
import { stackDefaults } from './defaults';
import { stackSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const stackBlock: BlockDefinition<typeof stackSchema, StackProps> = {
  key: 'stack',
  label: 'stack',
  category: 'layout',
  schema: stackSchema,
  defaults: stackDefaults,
  Component: StackBlock,
  bindable: [],
};

export { stackSchema, stackDefaults, StackBlock };
export type { StackProps };
