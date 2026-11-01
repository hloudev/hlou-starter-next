/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { CarouselProps } from './schema';
import { CarouselBlock } from './Component';
import { carouselDefaults } from './defaults';
import { carouselDesign } from './design';
import { carouselSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const carouselBlock: BlockDefinition<typeof carouselSchema, CarouselProps> = {
  key: 'carousel',
  label: 'carousel',
  category: 'library',
  ...carouselDesign,
  schema: carouselSchema,
  defaults: carouselDefaults,
  Component: CarouselBlock,
  bindable: ['title'],
  collectionProps: ['source'],
};

export { carouselSchema, carouselDefaults, CarouselBlock };
export type { CarouselProps };
