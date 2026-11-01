/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { ListingsStoredProps } from './schema';

import { densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** Cards from a collection. */
export const listingsDesign: BlockDesign<ListingsStoredProps> = {
  role: 'listing',
  variants: [
    {
      key: 'grid',
      labelKey: 'Design.variants.listings.grid',
      thumbnail: 'list-cards',
      props: { layout: 'grid' },
    },
    {
      key: 'rows',
      labelKey: 'Design.variants.listings.rows',
      thumbnail: 'list-rows',
      props: { layout: 'rows' },
    },
    {
      key: 'carousel',
      labelKey: 'Design.variants.listings.carousel',
      thumbnail: 'carousel',
      props: { layout: 'carousel' },
    },
  ],
  designOptions: [densityOption<ListingsStoredProps>()],
};
