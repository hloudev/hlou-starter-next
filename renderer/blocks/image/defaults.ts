/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ImageProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const imageDefaults: ImageProps = {
  media: null,
  alt: '',
  caption: '',
  ratio: 'landscape',
  fit: 'cover',
  width: 'wide',
  rounded: true,
  style: {},
  elements: {},
};
