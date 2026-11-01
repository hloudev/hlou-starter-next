/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { ArticleListStoredProps } from './schema';

import { densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** Articles from a collection. */
export const articleListDesign: BlockDesign<ArticleListStoredProps> = {
  role: 'news',
  variants: [
    {
      key: 'rows',
      labelKey: 'Design.variants.articleList.rows',
      thumbnail: 'article-list',
      props: { layout: 'rows' },
    },
    {
      key: 'grid',
      labelKey: 'Design.variants.articleList.grid',
      thumbnail: 'list-cards',
      props: { layout: 'grid' },
    },
    {
      key: 'carousel',
      labelKey: 'Design.variants.articleList.carousel',
      thumbnail: 'carousel',
      props: { layout: 'carousel' },
    },
  ],
  designOptions: [densityOption<ArticleListStoredProps>()],
};
