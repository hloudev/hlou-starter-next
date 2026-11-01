/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { COUNTRY_CODES, countryName } from '../../contracts/country';

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const cache = new Map<string, Array<[string, string]>>();

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Every country as `[code, name]`, named (`Intl.DisplayNames`) and sorted
 * (`Intl.Collator`) in `locale`, for a form's phone and country fields.
 * Computed on the server and handed to the island, so the browser's own
 * `Intl` data can never re-order or re-word the list on hydration.
 */
export function regionNames(locale: string): Array<[string, string]> {
  const held = cache.get(locale);
  if (held) return held;
  const collator = new Intl.Collator(locale);
  const names = COUNTRY_CODES.map((code): [string, string] => [
    code,
    countryName(code, locale),
  ]).sort((a, b) => collator.compare(a[1], b[1]));
  cache.set(locale, names);
  return names;
}
