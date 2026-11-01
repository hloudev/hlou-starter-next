/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { AudioProps } from './schema';
import { AudioBlock } from './Component';
import { audioDefaults } from './defaults';
import { audioSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const audioBlock: BlockDefinition<typeof audioSchema, AudioProps> = {
  key: 'audio',
  label: 'audio',
  category: 'blocks',
  schema: audioSchema,
  defaults: audioDefaults,
  Component: AudioBlock,
  bindable: ['media', 'title', 'caption'],
};

export { audioSchema, audioDefaults, AudioBlock };
export type { AudioProps };
