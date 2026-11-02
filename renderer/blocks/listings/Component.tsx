/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { ListingsCardsView } from './cards';
import type { ListingsProps } from './schema';
import { ListingsCards } from './cards';
import { listingsDefaults } from './defaults';
import { liveListIsland } from './live';

import { Island } from '../../render/island';
import { stateMessages } from '../../site/messages';
import { CarouselArrow } from '../carousel/Component';
import {
  BindBadge,
  blockParts,
  collectionOf,
  fieldAttr,
  FloatingLayer,
  literal,
  toListingItems,
} from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/*
 * Plain Tailwind. Each layout is a literal set: the list's own
 * display and columns, and what a card does inside it.
 */
const LAYOUT: Record<ListingsProps['layout'], { grid: string; card: string }> = {
  grid: {
    grid: 'grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3',
    card: 'block',
  },
  rows: {
    grid: 'grid grid-cols-1 gap-3.5',
    card: 'grid grid-cols-[120px_1fr] items-center',
  },
  carousel: {
    grid: 'flex gap-3.5 overflow-x-auto pb-2 [scroll-snap-type:inline_mandatory]',
    card: 'block flex-[0_0_min(280px,80%)] snap-start',
  },
};

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function ListingsBlock(props: BlockProps<ListingsProps>): ReactElement {
  const { root, context, el, box } = blockParts(props, 'listings', 'bg-site-well');
  const layout = LAYOUT[props.layout] ?? LAYOUT.grid;
  const title = literal(props.title, listingsDefaults.title as string);
  const collection = collectionOf(props.source);
  const items = collection
    ? toListingItems(collection, props.mapping, props.limit, context.locale)
    : [];
  const sourceKey =
    collection?.collectionKey ??
    (props.source && '$collection' in props.source ? props.source.$collection : null);
  const card = box(
    'cards',
    cx('overflow-hidden rounded-site border border-site-hairline bg-site-card', layout.card)
  );
  /* The carousel layout gets the carousel's arrows and island. */
  const carousel = props.layout === 'carousel';
  const m = stateMessages(context.locale).carousel;
  const view: ListingsCardsView = {
    gridClass: layout.grid,
    card,
    showPrice: props.showPrice,
    listAttrs: { ...fieldAttr(context, 'cards'), ...(carousel ? { 'data-hl-c-track': '' } : {}) },
    emptyLabel: sourceKey ?? '—',
  };
  /* A live collection reads its records again at runtime (CB-04). */
  const live = collection
    ? liveListIsland(collection, context, { mapping: props.mapping, limit: props.limit })
    : null;

  return (
    <section {...root} {...(carousel && context.mode === 'canvas' ? { 'data-hl-ready': '' } : {})}>
      <div className="relative mx-auto w-full max-w-site-content">
        <div className="mb-4.5 flex items-center gap-2.5">
          {title ? <h2 {...el('title', 'text-site-lg')}>{title}</h2> : null}
          {context.mode !== 'static' && sourceKey ? <BindBadge>DB {sourceKey}</BindBadge> : null}
          {carousel && items.length > 1 ? (
            <div className="ms-auto flex gap-2.5 max-md:hidden">
              <CarouselArrow forward={false} label={m.prev} disabled />
              <CarouselArrow forward label={m.next} disabled={false} />
            </div>
          ) : null}
        </div>
        {live ? (
          <Island
            name="liveList"
            markers={context.islands}
            props={{ ...live, kind: 'listings', view, items }}
          />
        ) : (
          <ListingsCards {...view} items={items} />
        )}
        {/* Over the content box, not the full-bleed section. */}
        <FloatingLayer slot={props.floating} />
      </div>
      {carousel ? (
        <Island
          name="carousel"
          markers={context.islands}
          props={{
            mode: 'scroll',
            autoplay: 0,
            loop: false,
            align: 'start',
            labels: { pause: m.pause, play: m.play },
            inert: context.mode === 'canvas',
          }}
        />
      ) : null}
    </section>
  );
}
