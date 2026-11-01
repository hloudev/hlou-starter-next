/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ListingsStoredProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const listingsDefaults: ListingsStoredProps = {
  source: null,
  title: 'Nos chambres',
  layout: 'grid',
  limit: 6,
  showPrice: true,
  mapping: {
    titleField: 'title',
    imageField: 'image',
    metaField: 'meta',
    priceField: 'price',
    hrefTemplate: '/rooms/{slug}',
  },
  style: {},
  elements: {},
  floating: [],
};
