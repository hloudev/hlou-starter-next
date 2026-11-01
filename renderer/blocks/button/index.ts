/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { ButtonProps } from './schema';
import { ButtonBlock } from './Component';
import { buttonDefaults } from './defaults';
import { buttonSchema, buttonVariantSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const buttonBlock: BlockDefinition<typeof buttonSchema, ButtonProps> = {
  key: 'button',
  label: 'button',
  category: 'blocks',
  schema: buttonSchema,
  defaults: buttonDefaults,
  Component: ButtonBlock,
  bindable: ['label'],
};

export { buttonSchema, buttonDefaults, ButtonBlock, buttonVariantSchema };
export type { ButtonProps };
