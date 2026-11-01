/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { HeroProps } from './schema';
import { HeroBlock } from './Component';
import { heroDefaults } from './defaults';
import { heroDesign } from './design';
import { heroSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const heroBlock: BlockDefinition<typeof heroSchema, HeroProps> = {
  key: 'hero',
  label: 'hero',
  category: 'library',
  ...heroDesign,
  schema: heroSchema,
  defaults: heroDefaults,
  Component: HeroBlock,
  bindable: ['image', 'eyebrow', 'title', 'description'],
};

export { heroSchema, heroDefaults, HeroBlock };
export type { HeroProps };
