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

/** Everything the article rows need but their items — plain JSON, so it crosses into an island. */
export type ArticleListRowsView = {
  /** The list's own classes (the layout's `list`). */
  listClass: string;
  /** One row's classes and style (`box('rows', …)`). */
  row: Styled;
  showPrice: boolean;
  /** The canvas's field marker for the rows; empty in static output. */
  listAttrs: { 'data-hl-field'?: string };
  /** What the empty state names: the collection key, or `—`. */
  emptyLabel: string;
};

export type ArticleListRowsProps = ArticleListRowsView & { items: ListingItem[] };

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * An article list's rows, or its empty state — the one markup the block's
 * server render and `LiveListClient` (CB-04) both draw.
 */
export function ArticleListRows({
  items,
  listClass,
  row,
  showPrice,
  listAttrs,
  emptyLabel,
}: ArticleListRowsProps): ReactElement {
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
    <ul className={listClass} {...listAttrs}>
      {items.map((item) => (
        <li key={item.id} className={row.className} style={row.style}>
          <MediaFigure
            className="aspect-[16/10]"
            media={item.image}
            sizes={MEDIA_SIZES_ATTR.third}
          />
          <div>
            <h3 className="mb-1 font-heading text-site-md">
              {item.href ? <a href={item.href}>{item.title}</a> : item.title}
            </h3>
            {item.meta ? <p className="text-site-xs text-site-ink-soft">{item.meta}</p> : null}
          </div>
          {showPrice && item.price ? (
            <span className="text-site-xs text-site-accent">{item.price}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
