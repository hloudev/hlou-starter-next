/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { MediaTextProps } from './schema';

import { densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** An image on one side, the copy on the other. */
export const mediaTextDesign: BlockDesign<MediaTextProps> = {
  role: 'content',
  variants: [
    {
      key: 'media-start',
      labelKey: 'Design.variants.mediaText.media-start',
      thumbnail: 'media-text',
      props: { mediaSide: 'start', split: '1-1' },
    },
    {
      key: 'media-end',
      labelKey: 'Design.variants.mediaText.media-end',
      thumbnail: 'text-media',
      props: { mediaSide: 'end', split: '1-1' },
    },
    {
      key: 'media-wide',
      labelKey: 'Design.variants.mediaText.media-wide',
      thumbnail: 'media-text',
      props: { mediaSide: 'start', split: '2-1' },
    },
    {
      key: 'text-wide',
      labelKey: 'Design.variants.mediaText.text-wide',
      thumbnail: 'text-media',
      props: { mediaSide: 'end', split: '1-2' },
    },
  ],
  designOptions: [densityOption<MediaTextProps>()],
};
