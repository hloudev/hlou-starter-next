/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { HeaderProps } from './schema';
import { HeaderBlock } from './Component';
import { headerDefaults } from './defaults';
import { headerDesign } from './design';
import { headerSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const headerBlock: BlockDefinition<typeof headerSchema, HeaderProps> = {
  key: 'header',
  label: 'header',
  category: 'library',
  ...headerDesign,
  schema: headerSchema,
  defaults: headerDefaults,
  Component: HeaderBlock,
  bindable: ['logo', 'logoMedia', 'links', 'ctaLabel'],
};

export { headerSchema, headerDefaults, HeaderBlock };
export type { HeaderProps };
