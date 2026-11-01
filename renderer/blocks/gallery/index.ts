/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { GalleryProps } from './schema';
import { GalleryBlock } from './Component';
import { galleryDefaults } from './defaults';
import { galleryDesign } from './design';
import { gallerySchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const galleryBlock: BlockDefinition<typeof gallerySchema, GalleryProps> = {
  key: 'gallery',
  label: 'gallery',
  category: 'library',
  ...galleryDesign,
  schema: gallerySchema,
  defaults: galleryDefaults,
  Component: GalleryBlock,
  bindable: ['title'],
};

export { gallerySchema, galleryDefaults, GalleryBlock };
export type { GalleryProps };
