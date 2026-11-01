/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { ListingsProps } from './schema';
import { ListingsBlock } from './Component';
import { listingsDefaults } from './defaults';
import { listingsDesign } from './design';
import { listingsSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const listingsBlock: BlockDefinition<typeof listingsSchema, ListingsProps> = {
  key: 'listings',
  label: 'listings',
  category: 'library',
  ...listingsDesign,
  schema: listingsSchema,
  defaults: listingsDefaults,
  Component: ListingsBlock,
  bindable: ['title'],
  collectionProps: ['source'],
};

export { listingsSchema, listingsDefaults, ListingsBlock };
export type { ListingsProps };
