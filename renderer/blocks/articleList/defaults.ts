/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ArticleListStoredProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const articleListDefaults: ArticleListStoredProps = {
  source: null,
  title: 'Journal',
  layout: 'rows',
  limit: 6,
  showPrice: true,
  mapping: {
    titleField: 'title',
    imageField: 'image',
    metaField: 'excerpt',
    priceField: 'date',
    hrefTemplate: '/journal/{slug}',
  },
  style: {},
  elements: {},
  floating: [],
};
