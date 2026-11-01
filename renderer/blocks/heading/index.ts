/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { HeadingProps } from './schema';
import { HeadingBlock } from './Component';
import { headingDefaults } from './defaults';
import { headingSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const headingBlock: BlockDefinition<typeof headingSchema, HeadingProps> = {
  key: 'heading',
  label: 'heading',
  category: 'blocks',
  schema: headingSchema,
  defaults: headingDefaults,
  Component: HeadingBlock,
  bindable: ['text'],
};

export { headingSchema, headingDefaults, HeadingBlock };
export type { HeadingProps };
