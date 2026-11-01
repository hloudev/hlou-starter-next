/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { CtaBandProps } from './schema';
import { CtaBandBlock } from './Component';
import { ctaBandDefaults } from './defaults';
import { ctaBandDesign } from './design';
import { ctaBandSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const ctaBandBlock: BlockDefinition<typeof ctaBandSchema, CtaBandProps> = {
  key: 'ctaBand',
  label: 'ctaBand',
  category: 'library',
  ...ctaBandDesign,
  schema: ctaBandSchema,
  defaults: ctaBandDefaults,
  Component: CtaBandBlock,
  bindable: ['title', 'description'],
};

export { ctaBandSchema, ctaBandDefaults, CtaBandBlock };
export type { CtaBandProps };
