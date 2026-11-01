/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { QuoteProps } from './schema';
import { QuoteBlock } from './Component';
import { quoteDefaults } from './defaults';
import { quoteDesign } from './design';
import { quoteSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const quoteBlock: BlockDefinition<typeof quoteSchema, QuoteProps> = {
  key: 'quote',
  label: 'quote',
  category: 'library',
  ...quoteDesign,
  schema: quoteSchema,
  defaults: quoteDefaults,
  Component: QuoteBlock,
  bindable: ['quote'],
};

export { quoteSchema, quoteDefaults, QuoteBlock };
export type { QuoteProps };
