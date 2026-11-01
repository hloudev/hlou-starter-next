/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { MediaTextProps } from './schema';
import { MediaTextBlock } from './Component';
import { mediaTextDefaults } from './defaults';
import { mediaTextDesign } from './design';
import { mediaTextSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const mediaTextBlock: BlockDefinition<typeof mediaTextSchema, MediaTextProps> = {
  key: 'mediaText',
  label: 'mediaText',
  category: 'library',
  ...mediaTextDesign,
  schema: mediaTextSchema,
  defaults: mediaTextDefaults,
  Component: MediaTextBlock,
  bindable: ['media', 'eyebrow', 'title', 'text'],
};

export { mediaTextSchema, mediaTextDefaults, MediaTextBlock };
export type { MediaTextProps };
