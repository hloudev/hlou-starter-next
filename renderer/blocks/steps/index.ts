/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { StepsProps } from './schema';
import { StepsBlock } from './Component';
import { stepsDefaults } from './defaults';
import { stepsSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const stepsBlock: BlockDefinition<typeof stepsSchema, StepsProps> = {
  key: 'steps',
  label: 'steps',
  category: 'interactive',
  schema: stepsSchema,
  defaults: stepsDefaults,
  Component: StepsBlock,
  bindable: [],
};

export { stepsSchema, stepsDefaults, StepsBlock };
export type { StepsProps };
