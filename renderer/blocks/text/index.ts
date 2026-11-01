/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { TextProps } from './schema';
import { TextBlock } from './Component';
import { textDefaults } from './defaults';
import { textSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const textBlock: BlockDefinition<typeof textSchema, TextProps> = {
  key: 'text',
  label: 'text',
  category: 'blocks',
  schema: textSchema,
  defaults: textDefaults,
  Component: TextBlock,
  bindable: ['body'],
};

export { textSchema, textDefaults, TextBlock };
export type { TextProps };
