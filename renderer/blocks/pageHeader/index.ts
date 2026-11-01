/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { PageHeaderProps } from './schema';
import { PageHeaderBlock } from './Component';
import { pageHeaderDefaults } from './defaults';
import { pageHeaderDesign } from './design';
import { pageHeaderSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const pageHeaderBlock: BlockDefinition<typeof pageHeaderSchema, PageHeaderProps> = {
  key: 'pageHeader',
  label: 'pageHeader',
  category: 'library',
  ...pageHeaderDesign,
  schema: pageHeaderSchema,
  defaults: pageHeaderDefaults,
  Component: PageHeaderBlock,
  bindable: ['eyebrow', 'title'],
};

export { pageHeaderSchema, pageHeaderDefaults, PageHeaderBlock };
export type { PageHeaderProps };
