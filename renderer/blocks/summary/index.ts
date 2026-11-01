/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { SummaryProps } from './schema';
import { SummaryBlock } from './Component';
import { summaryDefaults } from './defaults';
import { summarySchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const summaryBlock: BlockDefinition<typeof summarySchema, SummaryProps> = {
  key: 'summary',
  label: 'summary',
  category: 'interactive',
  schema: summarySchema,
  defaults: summaryDefaults,
  Component: SummaryBlock,
  bindable: ['title', 'media'],
};

export { summarySchema, summaryDefaults, SummaryBlock };
export type { SummaryProps };
