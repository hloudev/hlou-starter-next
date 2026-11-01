/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { QuantityProps } from './schema';
import { QuantityBlock } from './Component';
import { quantityDefaults } from './defaults';
import { quantitySchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const quantityBlock: BlockDefinition<typeof quantitySchema, QuantityProps> = {
  key: 'quantity',
  label: 'quantity',
  category: 'interactive',
  schema: quantitySchema,
  defaults: quantityDefaults,
  Component: QuantityBlock,
  bindable: ['label', 'hint', 'unitLabel'],
  collectionProps: ['source'],
};

export { quantitySchema, quantityDefaults, QuantityBlock };
export type { QuantityProps };
