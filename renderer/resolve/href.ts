/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/* Its own module, free of the block registry, so the live list island
   (CB-04) prefixes a runtime record's link the way the resolver did. */

/** The path's last segment names a file (`about.html`, `brochure.pdf`): never a page's. */
const FILE_PATH = /\/[^/?#]*\.[a-z0-9]+(?:[?#]|$)/i;

const NO_LEGACY_PATHS: ReadonlySet<string> = new Set();

/** `/cours` and `/cours/` are one legacy folder page, listed as `/cours/` (M36-09). */
function isLegacyPath(href: string, legacyPaths: ReadonlySet<string>): boolean {
  if (legacyPaths.size === 0) return false;
  const end = href.search(/[?#]/);
  const path = end === -1 ? href : href.slice(0, end);
  if (path === '/' || path === '') return false;
  return legacyPaths.has(path.endsWith('/') ? path : `${path}/`);
}

/**
 * Prefix a root-relative href with the base path: `/rooms` → `/fr/rooms`,
 * `/` → `/fr/`. Absolute URLs (`https:`, `mailto:`, `tel:`), fragments,
 * protocol-relative URLs and hrefs already under the base path are untouched.
 *
 * So is a path to a FILE (`/about.html`, `/docs/plan.pdf`): a Hlou page's
 * path never has an extension, so a file is something served beside the
 * pages — a legacy site's page (decision 187), a chrome file — and a locale
 * in front of it would point nowhere.
 *
 * And so is a path the build's legacy layer serves (`legacyPaths`, the
 * snapshot's — M36-09): a folder page `/cours/` has no extension, but it is
 * the old site's, not a Hlou page under a locale. `/` is always Hlou's home.
 *
 * A base path may carry a query (`/p/<slug>/fr?build=…`, the clean preview's
 * — the build, a share token, the stage's `embed`): it goes AFTER the href's
 * path, ahead of any fragment, so the link stays on the same build.
 */
export function prefixHref(
  href: string,
  basePath: string,
  legacyPaths: ReadonlySet<string> = NO_LEGACY_PATHS
): string {
  if (!basePath || !href.startsWith('/') || href.startsWith('//')) return href;
  if (FILE_PATH.test(href) || isLegacyPath(href, legacyPaths)) return href;
  const queryAt = basePath.indexOf('?');
  const base = queryAt === -1 ? basePath : basePath.slice(0, queryAt);
  const query = queryAt === -1 ? '' : basePath.slice(queryAt + 1);
  if (href === base || href.startsWith(`${base}/`)) return href;
  if (!query) return `${base}${href}`;
  const hashAt = href.indexOf('#');
  const path = hashAt === -1 ? href : href.slice(0, hashAt);
  const hash = hashAt === -1 ? '' : href.slice(hashAt);
  return `${base}${path}${path.includes('?') ? '&' : '?'}${query}${hash}`;
}
