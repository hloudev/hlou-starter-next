/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { VideoProps } from './schema';
import { resolveVideoSource, VideoBlock } from './Component';
import { videoDefaults } from './defaults';
import { videoSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const videoBlock: BlockDefinition<typeof videoSchema, VideoProps> = {
  key: 'video',
  label: 'video',
  category: 'blocks',
  schema: videoSchema,
  defaults: videoDefaults,
  Component: VideoBlock,
  bindable: ['media'],
};

export { videoSchema, videoDefaults, VideoBlock, resolveVideoSource };
export type { VideoProps };
