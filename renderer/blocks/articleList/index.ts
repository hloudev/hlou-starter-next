/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { ArticleListProps } from './schema';
import { ArticleListBlock } from './Component';
import { articleListDefaults } from './defaults';
import { articleListDesign } from './design';
import { articleListSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const articleListBlock: BlockDefinition<typeof articleListSchema, ArticleListProps> = {
  key: 'articleList',
  label: 'articleList',
  category: 'library',
  ...articleListDesign,
  schema: articleListSchema,
  defaults: articleListDefaults,
  Component: ArticleListBlock,
  bindable: ['title'],
  collectionProps: ['source'],
};

export { articleListSchema, articleListDefaults, ArticleListBlock };
export type { ArticleListProps };
