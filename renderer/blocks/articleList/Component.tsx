/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { ArticleListRowsView } from './rows';
import type { ArticleListProps } from './schema';
import { articleListDefaults } from './defaults';
import { ArticleListRows } from './rows';

import { Island } from '../../render/island';
import { liveListIsland } from '../listings/live';
import {
  BindBadge,
  blockParts,
  collectionOf,
  fieldAttr,
  FloatingLayer,
  literal,
  toListingItems,
} from '../shared';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/*
 * Plain Tailwind. `grid` lays the articles out as cards;
 * `rows` (and `carousel`, which has no look of its own yet) is a ruled list
 * whose rows put the image, the copy and the aside side by side from `md`.
 */
const ROWS = {
  list: 'm-0 list-none p-0',
  row: 'grid grid-cols-1 items-center gap-3 border-b border-site-hairline py-3.5 md:grid-cols-[110px_1fr_auto] md:gap-4',
};

const LAYOUT: Record<ArticleListProps['layout'], { list: string; row: string }> = {
  grid: {
    list: 'm-0 grid list-none grid-cols-1 gap-3.5 p-0 md:grid-cols-2 lg:grid-cols-3',
    row: 'grid grid-cols-1 items-center gap-3 md:gap-4',
  },
  rows: ROWS,
  carousel: ROWS,
};

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function ArticleListBlock(props: BlockProps<ArticleListProps>): ReactElement {
  const { root, context, el, box } = blockParts(props, 'articleList');
  const layout = LAYOUT[props.layout] ?? LAYOUT.rows;
  const title = literal(props.title, articleListDefaults.title as string);
  const collection = collectionOf(props.source);
  const items = collection
    ? toListingItems(collection, props.mapping, props.limit, context.locale)
    : [];
  const sourceKey =
    collection?.collectionKey ??
    (props.source && '$collection' in props.source ? props.source.$collection : null);
  const row = box('rows', layout.row);
  const view: ArticleListRowsView = {
    listClass: layout.list,
    row,
    showPrice: props.showPrice,
    listAttrs: fieldAttr(context, 'rows'),
    emptyLabel: sourceKey ?? '—',
  };
  /* A live collection reads its records again at runtime (CB-04). */
  const live = collection
    ? liveListIsland(collection, context, { mapping: props.mapping, limit: props.limit })
    : null;

  return (
    <section {...root}>
      <div className="relative mx-auto w-full max-w-site-content">
        {title || (context.mode !== 'static' && sourceKey) ? (
          <div className="mb-4.5 flex items-center gap-2.5">
            {title ? <h2 {...el('title', 'mb-5.5 text-site-lg')}>{title}</h2> : null}
            {context.mode !== 'static' && sourceKey ? <BindBadge>DB {sourceKey}</BindBadge> : null}
          </div>
        ) : null}
        {live ? (
          <Island
            name="liveList"
            markers={context.islands}
            props={{ ...live, kind: 'articleList', view, items }}
          />
        ) : (
          <ArticleListRows {...view} items={items} />
        )}
        {/* Over the content box, not the full-bleed section. */}
        <FloatingLayer slot={props.floating} />
      </div>
    </section>
  );
}
