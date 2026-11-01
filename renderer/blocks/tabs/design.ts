/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockVariant } from '../design-options';
import type { TabsProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** The two looks, for the Insert panel's tiles. No role: tabs sit in a section. */
export const tabsVariants: Array<BlockVariant<TabsProps>> = [
  {
    key: 'underline',
    labelKey: 'Design.variants.tabs.underline',
    thumbnail: 'tabs',
    props: { look: 'underline' },
  },
  {
    key: 'pills',
    labelKey: 'Design.variants.tabs.pills',
    thumbnail: 'tabs',
    props: { look: 'pills' },
  },
];
