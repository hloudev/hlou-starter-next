/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { GalleryProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const galleryDefaults: GalleryProps = {
  title: '',
  items: [
    { media: null, caption: 'Série I', href: '', span: '1' },
    { media: null, caption: 'Série II', href: '', span: '1' },
    { media: null, caption: 'Série III', href: '', span: '1' },
    { media: null, caption: 'Série IV', href: '', span: '1' },
    { media: null, caption: 'Série V', href: '', span: '1' },
    { media: null, caption: 'Série VI', href: '', span: '1' },
  ],
  layout: 'grid',
  columns: { base: 2, md: 3 },
  gap: { base: '3', md: '5' },
  ratio: 'square',
  hover: 'zoom',
  onClick: 'lightbox',
  style: {},
  elements: {},
};
