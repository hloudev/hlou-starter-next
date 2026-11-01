'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useEffect, useState } from 'react';

import type { ReactElement } from 'react';
import type { CollectionQuery, LiveRecordsResponse, ResolvedRecord } from '../../contracts';
import type { ArticleListRowsView } from '../articleList/rows';
import type { ListingItem, ListingMapping } from '../shared';
import type { ListingsCardsView } from './cards';
import { ListingsCards } from './cards';

import { prefixHref } from '../../resolve/href';
import { applyQuery } from '../../resolve/query';
import { ArticleListRows } from '../articleList/rows';
import { toListingItems } from '../shared';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

type LiveListCommon = {
  /** `liveRecordsUrl(recordsEndpoint, key, { locale, buildId })` — never empty here. */
  url: string;
  /** The render's base path: the endpoint's links are root-relative. */
  basePath: string;
  /** The block's mapping, already resolved (its `hrefTemplate` under the base path). */
  mapping: ListingMapping;
  /** The block's own card count. */
  limit: number;
  /** The page's locale: a money price prints in it. */
  locale: string;
  /** The collection ref's `query`: sort, limit, filter — applied again at runtime. */
  query?: CollectionQuery;
  /** The frozen cards, exactly as the server drew them. */
  items: ListingItem[];
};

export type LiveListClientProps =
  | (LiveListCommon & { kind: 'listings'; view: ListingsCardsView })
  | (LiveListCommon & { kind: 'articleList'; view: ArticleListRowsView });

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown, nullable: boolean): boolean {
  return value === undefined || typeof value === 'string' || (nullable && value === null);
}

function isLiveRecord(value: unknown): value is ResolvedRecord {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    isOptionalString(value.slug, true) &&
    isObject(value.data) &&
    isOptionalString(value.publishedAt, true) &&
    isOptionalString(value.href, false)
  );
}

/**
 * `liveRecordsResponseSchema`, checked by hand: the island stays out of zod
 * and the contracts, which would weigh half a megabyte on every page that
 * draws a live list. `live.test.ts` holds the two to the same verdicts.
 */
export function isLiveRecordsResponse(value: unknown): value is LiveRecordsResponse {
  if (!isObject(value) || !isObject(value.data)) return false;
  const { collectionKey, environment, records } = value.data;
  return (
    typeof collectionKey === 'string' &&
    collectionKey.length > 0 &&
    (environment === 'production' || environment === 'preview') &&
    Array.isArray(records) &&
    records.every(isLiveRecord)
  );
}

/** Runtime records → cards, the way the block turned the frozen ones into cards. */
export function liveListItems(
  records: ResolvedRecord[],
  props: Pick<LiveListCommon, 'basePath' | 'mapping' | 'limit' | 'locale' | 'query'>
): ListingItem[] {
  const linked = records.map((record) =>
    record.href ? { ...record, href: prefixHref(record.href, props.basePath) } : record
  );
  return toListingItems(
    {
      $resolved: 'collection',
      collectionKey: '',
      delivery: 'live',
      fields: [],
      records: applyQuery(linked, props.query),
    },
    props.mapping,
    props.limit,
    props.locale
  );
}

/**
 * One runtime read: the cards to draw now, or `null` to keep the frozen ones
 * — a failed request, a refused one, an answer that is not the contract's.
 */
export async function readLiveList(
  url: string,
  props: Pick<LiveListCommon, 'basePath' | 'mapping' | 'limit' | 'locale' | 'query'>,
  options: { signal?: AbortSignal; fetch?: typeof fetch } = {}
): Promise<ListingItem[] | null> {
  if (!url) return null;
  try {
    const response = await (options.fetch ?? fetch)(url, {
      signal: options.signal,
      credentials: 'omit',
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    return isLiveRecordsResponse(body) ? liveListItems(body.data.records, props) : null;
  } catch {
    /* Offline, blocked, aborted: the frozen cards stay. */
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * A live collection's list (series CB, CB-j). The first render is the frozen
 * cards, so it hydrates over the server HTML unchanged; then it reads the
 * collection again from the public records endpoint and draws what is
 * published now, through the same card markup. A failed read keeps the
 * frozen cards — the visitor never sees an error for a list that was fine.
 */
export function LiveListClient(props: LiveListClientProps): ReactElement {
  const { url, basePath, mapping, limit, locale, query } = props;
  const [items, setItems] = useState<ListingItem[]>(props.items);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    void readLiveList(
      url,
      { basePath, mapping, limit, locale, query },
      { signal: controller.signal }
    ).then((next) => {
      if (next) setItems(next);
    });
    return () => controller.abort();
    /* The props are the server's and never change after hydration. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return props.kind === 'listings' ? (
    <ListingsCards {...props.view} items={items} />
  ) : (
    <ArticleListRows {...props.view} items={items} />
  );
}
