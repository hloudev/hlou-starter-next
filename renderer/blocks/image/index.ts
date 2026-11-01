/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { ImageProps } from './schema';
import { ImageBlock } from './Component';
import { imageDefaults } from './defaults';
import { imageSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const imageBlock: BlockDefinition<typeof imageSchema, ImageProps> = {
  key: 'image',
  label: 'image',
  category: 'blocks',
  schema: imageSchema,
  defaults: imageDefaults,
  Component: ImageBlock,
  bindable: ['media'],
};

export { imageSchema, imageDefaults, ImageBlock };
export type { ImageProps };
