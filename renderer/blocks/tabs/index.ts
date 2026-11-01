/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { TabsProps } from './schema';
import { TabsBlock } from './Component';
import { tabsDefaults } from './defaults';
import { tabsVariants } from './design';
import { TABS_PANEL_KEYS, tabsSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const tabsBlock: BlockDefinition<typeof tabsSchema, TabsProps> = {
  key: 'tabs',
  label: 'tabs',
  category: 'layout',
  schema: tabsSchema,
  defaults: tabsDefaults,
  Component: TabsBlock,
  bindable: [],
  variants: tabsVariants,
};

export { tabsSchema, tabsDefaults, TabsBlock, TABS_PANEL_KEYS };
export type { TabsProps };
