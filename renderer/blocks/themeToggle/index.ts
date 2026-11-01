/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { ThemeToggleProps } from './schema';
import { ThemeToggleBlock } from './Component';
import { themeToggleDefaults } from './defaults';
import { themeToggleSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const themeToggleBlock: BlockDefinition<typeof themeToggleSchema, ThemeToggleProps> = {
  key: 'themeToggle',
  label: 'themeToggle',
  category: 'blocks',
  schema: themeToggleSchema,
  defaults: themeToggleDefaults,
  Component: ThemeToggleBlock,
  bindable: ['label'],
};

export { themeToggleSchema, themeToggleDefaults, ThemeToggleBlock };
export type { ThemeToggleProps };
