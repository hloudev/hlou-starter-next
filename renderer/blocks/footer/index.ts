/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { FooterProps } from './schema';
import { FooterBlock } from './Component';
import { footerDefaults } from './defaults';
import { footerDesign } from './design';
import { footerSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const footerBlock: BlockDefinition<typeof footerSchema, FooterProps> = {
  key: 'footer',
  label: 'footer',
  category: 'library',
  ...footerDesign,
  schema: footerSchema,
  defaults: footerDefaults,
  Component: FooterBlock,
  bindable: ['logoMedia', 'legal'],
};

export { footerSchema, footerDefaults, FooterBlock };
export type { FooterProps };
