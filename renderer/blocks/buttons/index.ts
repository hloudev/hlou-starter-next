/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { ButtonsProps } from './schema';
import { ButtonsBlock } from './Component';
import { buttonsDefaults } from './defaults';
import { buttonsSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const buttonsBlock: BlockDefinition<typeof buttonsSchema, ButtonsProps> = {
  key: 'buttons',
  label: 'buttons',
  category: 'blocks',
  schema: buttonsSchema,
  defaults: buttonsDefaults,
  Component: ButtonsBlock,
  bindable: [],
};

export { buttonsSchema, buttonsDefaults, ButtonsBlock };
export type { ButtonsProps };
