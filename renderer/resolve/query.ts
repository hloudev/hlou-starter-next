/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CollectionQuery, ResolvedRecord } from '../contracts';

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/*
 * A collection ref's `query` over resolved records. Its own module, free of
 * the block registry, so the live list island (CB-04) applies the same query
 * in the browser that the resolver applied to the frozen render.
 */

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return String(a).localeCompare(String(b));
}

export function applyQuery(
  records: ResolvedRecord[],
  query: CollectionQuery | undefined
): ResolvedRecord[] {
  let result = records;
  if (query?.filter) {
    const entries = Object.entries(query.filter);
    result = result.filter((record) =>
      entries.every(([field, expected]) => record.data[field] === expected)
    );
  }
  if (query?.sort) {
    const { field, dir } = query.sort;
    const sign = dir === 'desc' ? -1 : 1;
    result = [...result].sort((a, b) => sign * compare(a.data[field], b.data[field]));
  }
  if (query?.limit !== undefined) {
    result = result.slice(0, query.limit);
  }
  return result;
}
