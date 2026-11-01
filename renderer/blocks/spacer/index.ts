/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { SpacerProps } from './schema';
import { SpacerBlock } from './Component';
import { spacerDefaults } from './defaults';
import { spacerSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const spacerBlock: BlockDefinition<typeof spacerSchema, SpacerProps> = {
  key: 'spacer',
  label: 'spacer',
  category: 'layout',
  schema: spacerSchema,
  defaults: spacerDefaults,
  Component: SpacerBlock,
  bindable: [],
};

export { spacerSchema, spacerDefaults, SpacerBlock };
export type { SpacerProps };
