/* -------------------------------------------------------------------------- */
/*                                   FORMAT                                   */
/* -------------------------------------------------------------------------- */

/*
 * The site spec's file tree. A site's definition as keyed
 * JSON files a person or an agent writes by hand: `hlou/site/**` is editable,
 * the lock beside it is generated. Defined here, in the renderer, because the
 * starter vendors only the renderer and compiles the spec there. Nothing else
 * defines the format.
 */

/** `hlou/site/site.json`'s `format`. A reader refuses any other number. */
export const SITE_SPEC_FORMAT = 1;

/** Every authored spec file sits under this folder. */
export const SITE_SPEC_ROOT = 'hlou/site';

/** The generated lock: every key of the spec → the uuid it had in the base. */
export const SITE_SPEC_LOCK_PATH = 'hlou/site.lock.json';

/** The project's definition, locales, theme, components and site slots. */
export const SITE_SPEC_SITE_PATH = `${SITE_SPEC_ROOT}/site.json`;

export const SITE_SPEC_PAGES_DIR = `${SITE_SPEC_ROOT}/pages`;
export const SITE_SPEC_CONTENT_DIR = `${SITE_SPEC_ROOT}/content`;
export const SITE_SPEC_COLLECTIONS_DIR = `${SITE_SPEC_ROOT}/collections`;

/** Where a medium's bytes sit in the starter: `/media/a/b.png` → `public/media/a/b.png`. */
export const SITE_SPEC_MEDIA_DIR = 'public/media';

/**
 * A medium as the spec names it: `/media/<dir>/<file>`, the URL the starter
 * serves it at. One folder level, as the builder writes media (`<assetId>/
 * <file>`), so an exported spec and a hand-made one look alike.
 */
export const SITE_SPEC_MEDIA_PATH = /^\/media\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

/** The content key of a site-level slot: `site/<slotKey>`. */
export const SITE_SPEC_SITE_SCOPE = 'site';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

export function siteSpecPagePath(slug: string): string {
  return `${SITE_SPEC_PAGES_DIR}/${slug}.json`;
}

export function siteSpecContentPath(locale: string): string {
  return `${SITE_SPEC_CONTENT_DIR}/${locale}.json`;
}

export function siteSpecCollectionPath(key: string): string {
  return `${SITE_SPEC_COLLECTIONS_DIR}/${key}.json`;
}

export function isSiteSpecMediaPath(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    SITE_SPEC_MEDIA_PATH.test(value) &&
    !value.split('/').some((segment) => segment === '.' || segment === '..')
  );
}

/** The file a media path resolves to, relative to the starter's root. */
export function siteSpecMediaFile(mediaPath: string): string {
  return `${SITE_SPEC_MEDIA_DIR}${mediaPath.slice('/media'.length)}`;
}

/** A content key: `<pageSlug>/<slotKey>`, or `site/<slotKey>` for a site slot. */
export function siteSpecContentKey(scope: string, slotKey: string): string {
  return `${scope}/${slotKey}`;
}

/** `home/hero.title` → `{ scope: 'home', slotKey: 'hero.title' }`; null when it has no `/`. */
export function parseSiteSpecContentKey(key: string): { scope: string; slotKey: string } | null {
  const at = key.indexOf('/');
  if (at <= 0 || at === key.length - 1) return null;
  return { scope: key.slice(0, at), slotKey: key.slice(at + 1) };
}

export type SiteSpecFileRef =
  | { kind: 'site' }
  | { kind: 'page'; slug: string }
  | { kind: 'content'; locale: string }
  | { kind: 'collection'; key: string }
  | { kind: 'lock' };

/**
 * What a path of the tree is, or null for a file the spec does not define. The
 * name inside the path (`<slug>`, `<locale>`, `<key>`) is returned as written;
 * the schema checks its grammar.
 */
export function parseSiteSpecPath(path: string): SiteSpecFileRef | null {
  if (path === SITE_SPEC_LOCK_PATH) return { kind: 'lock' };
  if (path === SITE_SPEC_SITE_PATH) return { kind: 'site' };
  const match = /^hlou\/site\/(pages|content|collections)\/([^/]+)\.json$/.exec(path);
  if (!match) return null;
  const [, dir, name = ''] = match;
  if (dir === 'pages') return { kind: 'page', slug: name };
  if (dir === 'content') return { kind: 'content', locale: name };
  return { kind: 'collection', key: name };
}
