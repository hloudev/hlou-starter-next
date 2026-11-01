/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { LogoCloudProps } from './schema';
import { LogoCloudBlock } from './Component';
import { logoCloudDefaults } from './defaults';
import { logoCloudDesign } from './design';
import { logoCloudSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const logoCloudBlock: BlockDefinition<typeof logoCloudSchema, LogoCloudProps> = {
  key: 'logoCloud',
  label: 'logoCloud',
  category: 'library',
  ...logoCloudDesign,
  schema: logoCloudSchema,
  defaults: logoCloudDefaults,
  Component: LogoCloudBlock,
  bindable: ['title'],
};

export { logoCloudSchema, logoCloudDefaults, LogoCloudBlock };
export type { LogoCloudProps };
