/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CollectionQuery, ResolvedCollection } from '../../contracts';
import type { ListingMapping } from '../shared';
import type { SiteRenderContext } from '../types';

import { liveRecordsUrl } from '../../contracts';

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

function queryOf(collection: ResolvedCollection): CollectionQuery | undefined {
  const query = (collection as ResolvedCollection & { query?: unknown }).query;
  return typeof query === 'object' && query !== null ? (query as CollectionQuery) : undefined;
}

/**
 * The `LiveListClient` props a catalogue block shares (CB-04), or `null` when
 * the list stays as frozen: only a `live` collection, and only where the
 * render has a records endpoint — never the canvas or a draft. The build
 * travels in the query, so a preview build reads its Sandbox too.
 */
export function liveListIsland(
  collection: ResolvedCollection,
  context: SiteRenderContext,
  block: { mapping: ListingMapping; limit: number }
): {
  url: string;
  basePath: string;
  mapping: ListingMapping;
  limit: number;
  locale: string;
  query?: CollectionQuery;
} | null {
  if (collection.delivery !== 'live' || !context.recordsEndpoint) return null;
  const url = liveRecordsUrl(context.recordsEndpoint, collection.collectionKey, {
    locale: context.locale,
    buildId: context.formBuildId ?? null,
  });
  if (!url) return null;
  const query = queryOf(collection);
  return {
    url,
    basePath: context.basePath ?? '',
    mapping: block.mapping,
    limit: block.limit,
    locale: context.locale,
    ...(query ? { query } : {}),
  };
}
