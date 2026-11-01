/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { CustomProps } from './schema';
import { CustomBlock } from './Component';
import { customDefaults } from './defaults';
import { customDesign } from './design';
import { customSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const customBlock: BlockDefinition<typeof customSchema, CustomProps> = {
  key: 'custom',
  label: 'custom',
  category: 'library',
  ...customDesign,
  schema: customSchema,
  defaults: customDefaults,
  Component: CustomBlock,
  bindable: ['eyebrow', 'title', 'text'],
};

export { customSchema, customDefaults, CustomBlock };
export type { CustomProps };
