/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { CardsProps } from './schema';
import { CardsBlock } from './Component';
import { cardsDefaults } from './defaults';
import { cardsDesign } from './design';
import { cardsSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const cardsBlock: BlockDefinition<typeof cardsSchema, CardsProps> = {
  key: 'cards',
  label: 'cards',
  category: 'library',
  ...cardsDesign,
  schema: cardsSchema,
  defaults: cardsDefaults,
  Component: CardsBlock,
  bindable: ['title'],
};

export { cardsSchema, cardsDefaults, CardsBlock };
export type { CardsProps };
