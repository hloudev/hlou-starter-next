/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { ListingItem, Styled } from '../shared';

import { MEDIA_SIZES_ATTR } from '../media';
import { MediaFigure } from '../shared';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** Everything the card list needs but its items — plain JSON, so it crosses into an island. */
export type ListingsCardsView = {
  /** The list's own display and columns (the layout's `grid`). */
  gridClass: string;
  /** One card's classes and style (`box('cards', …)`). */
  card: Styled;
  showPrice: boolean;
  /** The canvas's field marker for the card list; empty in static output. The
   *  carousel layout marks the list as the `carousel` island's track. */
  listAttrs: { 'data-hl-field'?: string; 'data-hl-c-track'?: string };
  /** What the empty state names: the collection key, or `—`. */
  emptyLabel: string;
};

export type ListingsCardsProps = ListingsCardsView & { items: ListingItem[] };

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * A listing's cards, or its empty state. The one markup both paths draw: the
 * block's server render and, for a live collection, `LiveListClient` after it
 * has read the records again (CB-04) — so the island's first render IS the
 * server HTML.
 */
export function ListingsCards({
  items,
  gridClass,
  card,
  showPrice,
  listAttrs,
  emptyLabel,
}: ListingsCardsProps): ReactElement {
  if (items.length === 0) {
    return (
      <div
        className="rounded-site border border-dashed border-site-hairline-strong py-4.5 text-center text-site-sm text-site-ink-soft"
        data-hl-empty="true"
      >
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className={gridClass} {...listAttrs}>
      {items.map((item) => {
        const body = (
          <>
            <MediaFigure
              className="aspect-[4/3] rounded-none"
              media={item.image}
              sizes={MEDIA_SIZES_ATTR.third}
            />
            <div className="p-3">
              <h3 className="mb-0.75 font-[inherit] text-site-sm">{item.title}</h3>
              {item.meta ? <p className="text-site-xs text-site-ink-soft">{item.meta}</p> : null}
              {showPrice && item.price ? (
                <p className="mt-2.25 text-site-sm text-site-accent">{item.price}</p>
              ) : null}
            </div>
          </>
        );
        return item.href ? (
          <a key={item.id} className={card.className} style={card.style} href={item.href}>
            {body}
          </a>
        ) : (
          <article key={item.id} className={card.className} style={card.style}>
            {body}
          </article>
        );
      })}
    </div>
  );
}
