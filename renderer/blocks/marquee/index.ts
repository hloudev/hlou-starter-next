/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { MarqueeProps } from './schema';
import { MarqueeBlock } from './Component';
import { marqueeDefaults } from './defaults';
import { marqueeDesign } from './design';
import { marqueeSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const marqueeBlock: BlockDefinition<typeof marqueeSchema, MarqueeProps> = {
  key: 'marquee',
  label: 'marquee',
  category: 'library',
  ...marqueeDesign,
  schema: marqueeSchema,
  defaults: marqueeDefaults,
  Component: MarqueeBlock,
  bindable: [],
};

export { marqueeSchema, marqueeDefaults, MarqueeBlock };
export type { MarqueeProps };
