/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { AccordionProps } from './schema';
import { AccordionBlock } from './Component';
import { accordionDefaults } from './defaults';
import { accordionDesign } from './design';
import { accordionSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const accordionBlock: BlockDefinition<typeof accordionSchema, AccordionProps> = {
  key: 'accordion',
  label: 'accordion',
  category: 'library',
  ...accordionDesign,
  schema: accordionSchema,
  defaults: accordionDefaults,
  Component: AccordionBlock,
  bindable: ['title'],
};

export { accordionSchema, accordionDefaults, AccordionBlock };
export type { AccordionProps };
