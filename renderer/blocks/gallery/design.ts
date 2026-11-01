/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { GalleryProps } from './schema';

import { densityOption, responsiveColumnsOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** Many images. */
export const galleryDesign: BlockDesign<GalleryProps> = {
  role: 'gallery',
  variants: [
    {
      key: 'grid',
      labelKey: 'Design.variants.gallery.grid',
      thumbnail: 'gallery-grid',
      props: { layout: 'grid' },
    },
    {
      key: 'masonry',
      labelKey: 'Design.variants.gallery.masonry',
      thumbnail: 'gallery-masonry',
      props: { layout: 'masonry' },
    },
    {
      key: 'justified',
      labelKey: 'Design.variants.gallery.justified',
      thumbnail: 'gallery-grid',
      props: { layout: 'justified' },
    },
    {
      key: 'strip',
      labelKey: 'Design.variants.gallery.strip',
      thumbnail: 'gallery-strip',
      props: { layout: 'strip' },
    },
  ],
  designOptions: [
    densityOption<GalleryProps>(),
    responsiveColumnsOption<GalleryProps, 'columns'>('columns', [2, 3, 4]),
  ],
};
