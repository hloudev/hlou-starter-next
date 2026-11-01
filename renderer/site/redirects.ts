/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { SiteSnapshot } from '../contracts';
import { getSourceLocale, localePath, siteRoutes } from './routes';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** A static redirect: the document at `path` forwards to `to` (`RedirectBody`), query and hash kept. */
export type RedirectStub = { path: string; locale: string; to: string };

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * `/` and every unprefixed path (`/rooms`, `/rooms/jasmin`) → the default
 * locale. Block props may carry literal hrefs without a locale (the renderer
 * only prefixes hrefs it derives from a page id), so every default-locale
 * path gets a stub. `RedirectBody` forwards on any host, with JavaScript off too.
 */
export function redirectStubs(snapshot: SiteSnapshot): RedirectStub[] {
  const locale = getSourceLocale(snapshot).code;
  const stubs: RedirectStub[] = [{ path: '/', locale, to: localePath(locale, '/') }];
  const seen = new Set<string>(['/']);
  for (const route of siteRoutes(snapshot)) {
    if (route.locale !== locale || seen.has(route.path)) continue;
    seen.add(route.path);
    stubs.push({ path: route.path, locale, to: localePath(locale, route.path) });
  }
  return stubs;
}
