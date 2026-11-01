/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type {
  ContentValue,
  MediaDoc,
  PageDocV2,
  RecordDoc,
  SiteColorScheme,
  SiteLocaleInfo,
  SiteSnapshot,
} from '../contracts';

import { findRecordBySlug, listStaticPaths } from '../resolve';
import { resolveDarkColors } from '../theme/scheme';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type ResolvedRoute = {
  page: PageDocV2;
  /** The current record on a `collection_template` page. */
  record?: RecordDoc;
  /** The concrete path, `[slug]` filled. */
  path: string;
};

/** One exported page in one locale — what every build method writes. */
export type SiteRoute = ResolvedRoute & { locale: string };

/* -------------------------------------------------------------------------- */
/*                                   LOCALES                                  */
/* -------------------------------------------------------------------------- */

/** The snapshot contract guarantees exactly one source locale. */
export function getSourceLocale(snapshot: SiteSnapshot): SiteLocaleInfo {
  const source = snapshot.locales.find((locale) => locale.isSource) ?? snapshot.locales[0];
  if (!source) throw new Error('snapshot has no locale');
  return source;
}

export function getLocaleInfo(snapshot: SiteSnapshot, code: string): SiteLocaleInfo {
  return snapshot.locales.find((locale) => locale.code === code) ?? getSourceLocale(snapshot);
}

/* -------------------------------------------------------------------------- */
/*                                    PAGES                                   */
/* -------------------------------------------------------------------------- */

/** `/` for `[]`, `/rooms/jasmin` for `["rooms", "jasmin"]`. */
export function slugToPath(slug: string[] | undefined): string {
  if (!slug || slug.length === 0) return '/';
  return `/${slug.map((segment) => decodeURIComponent(segment)).join('/')}`;
}

/** `[]` for `/`, `["rooms", "jasmin"]` for `/rooms/jasmin`. */
export function pathToSlug(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/** `/fr/rooms/jasmin/` — the exported location of a path in a locale. */
export function localePath(locale: string, path: string): string {
  return path === '/' ? `/${locale}/` : `/${locale}${path}/`;
}

function templatePattern(pagePath: string): RegExp {
  const source = pagePath
    .split('/')
    .map((segment) =>
      segment === '[slug]' ? '([^/]+)' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    .join('/');
  return new RegExp(`^${source}$`);
}

/**
 * The page (and record) a path names, or `undefined` when nothing published
 * lives there. Static pages match exactly; template pages match on their
 * `[slug]` segment against the collection's published records.
 */
export function resolveRoute(snapshot: SiteSnapshot, path: string): ResolvedRoute | undefined {
  for (const page of snapshot.pages) {
    if (page.status === 'draft') continue;
    if (page.kind === 'collection_template') {
      if (!page.collectionKey) continue;
      const match = templatePattern(page.path).exec(path);
      const slug = match?.[1];
      if (!slug) continue;
      const record = findRecordBySlug(snapshot, page.collectionKey, slug);
      if (record) return { page, record, path };
      continue;
    }
    if (page.path === path) return { page, path };
  }
  return undefined;
}

/**
 * Every page × locale the export produces, resolved — the one list both
 * build methods write, so a route cannot exist in one and not the other.
 */
export function siteRoutes(snapshot: SiteSnapshot): SiteRoute[] {
  const routes: SiteRoute[] = [];
  for (const entry of listStaticPaths(snapshot)) {
    const route = resolveRoute(snapshot, entry.path);
    if (route) routes.push({ ...route, locale: entry.locale });
  }
  return routes;
}

/* -------------------------------------------------------------------------- */
/*                                   CONTENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * The content of a slot for `locale` (source locale as fallback), by slot
 * *key* on a page (`seo.title`) or on the site (`site.logo`) — the page's
 * slot first, then the site's of the same key. A page slot with no value in
 * either locale gives way to the site's: a page whose share image was
 * removed shares the site's again, not the generated card (M30-6).
 */
function getSlotValue(
  snapshot: SiteSnapshot,
  locale: string,
  key: string,
  page?: PageDocV2
): ContentValue | undefined {
  const source = getSourceLocale(snapshot).code;
  const valueOf = (slotId: string) =>
    snapshot.content[locale]?.[slotId] ?? snapshot.content[source]?.[slotId];
  const pageSlot = page?.slots.find((candidate) => candidate.key === key);
  const own = pageSlot ? valueOf(pageSlot.id) : undefined;
  if (own) return own;
  const siteSlot = snapshot.siteSlots.find((candidate) => candidate.key === key);
  return siteSlot ? valueOf(siteSlot.id) : undefined;
}

/**
 * The plain text of a slot for `locale` (source locale as fallback), by slot
 * *key* on a page (`seo.title`) or on the site (`site.logo`). Media and
 * dynamic slots return `undefined`.
 */
export function getSlotText(
  snapshot: SiteSnapshot,
  locale: string,
  key: string,
  page?: PageDocV2
): string | undefined {
  const value = getSlotValue(snapshot, locale, key, page);
  if (!value) return undefined;
  if (value.kind === 'text' || value.kind === 'heading') return value.text.trim() || undefined;
  return undefined;
}

/** The media a slot holds for `locale`, by key, as `getSlotText` finds it. */
export function getSlotMedia(
  snapshot: SiteSnapshot,
  locale: string,
  key: string,
  page?: PageDocV2
): MediaDoc | undefined {
  const value = getSlotValue(snapshot, locale, key, page);
  return value?.kind === 'media' ? getMedia(snapshot, value.assetId) : undefined;
}

/** A localised record field as text, source locale as fallback. */
export function getRecordText(
  snapshot: SiteSnapshot,
  record: RecordDoc,
  field: string,
  locale: string
): string | undefined {
  const value = record.data[field];
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const localized = value as Record<string, unknown>;
    const picked =
      localized[locale] ?? localized[getSourceLocale(snapshot).code] ?? Object.values(localized)[0];
    return typeof picked === 'string' ? picked : undefined;
  }
  return undefined;
}

export function getMedia(
  snapshot: SiteSnapshot,
  assetId: string | null | undefined
): MediaDoc | undefined {
  if (!assetId) return undefined;
  return snapshot.media[assetId];
}

/* -------------------------------------------------------------------------- */
/*                                  SETTINGS                                  */
/* -------------------------------------------------------------------------- */

/**
 * The public site name in `locale`: the `site.name` slot (source locale as
 * fallback), then `settings.siteName`, then the project's name.
 */
export function getSiteName(snapshot: SiteSnapshot, locale?: string): string {
  const fromSlot = getSlotText(snapshot, locale ?? getSourceLocale(snapshot).code, 'site.name');
  return fromSlot ?? snapshot.settings.siteName ?? snapshot.project.name;
}

/** The site's default description in `locale`: the `seo.description` site slot, then settings. */
export function getSiteDescription(snapshot: SiteSnapshot, locale?: string): string | undefined {
  const code = locale ?? getSourceLocale(snapshot).code;
  return getSlotText(snapshot, code, 'seo.description') ?? snapshot.settings.description;
}

/** The optional `site.tagline` in `locale` — the home title's second half and the card's subtitle. */
export function getSiteTagline(snapshot: SiteSnapshot, locale?: string): string | undefined {
  return getSlotText(snapshot, locale ?? getSourceLocale(snapshot).code, 'site.tagline');
}

/**
 * The site's logo image in `locale` (`site.logoImage`, decision 146 — an
 * Arabic logo is a real request). `site.logo` stays the text wordmark.
 */
export function getSiteLogo(snapshot: SiteSnapshot, locale?: string): MediaDoc | undefined {
  return getSlotMedia(snapshot, locale ?? getSourceLocale(snapshot).code, 'site.logoImage');
}

/** The image a link to a page shows when shared. */
export type ShareImage = {
  url: string;
  width?: number;
  height?: number;
  /** `undefined` when the media carries no alt in any locale. */
  alt?: string;
  type?: string;
};

/** The generated social card (`ogImage()`), the last link of the chain. */
export const DEFAULT_SHARE_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  type: 'image/png',
} as const satisfies ShareImage;

/**
 * The share image of a route in `locale`: the page's `seo.image` slot, then
 * the site's (`getSlotMedia` falls back from one to the other), then the
 * generated `/og.png` — with the media's real dimensions and the locale's alt.
 */
export function getShareImage(
  snapshot: SiteSnapshot,
  locale: string,
  route?: Pick<ResolvedRoute, 'page'>
): ShareImage {
  const media = getSlotMedia(snapshot, locale, 'seo.image', route?.page);
  if (!media) return { ...DEFAULT_SHARE_IMAGE };
  const alt = media.alt[locale] ?? media.alt[getSourceLocale(snapshot).code];
  return {
    url: media.url,
    ...(media.width ? { width: media.width } : {}),
    ...(media.height ? { height: media.height } : {}),
    ...(alt ? { alt } : {}),
    ...(media.mime ? { type: media.mime } : {}),
  };
}

/**
 * The media the site's icon set is generated from (decision 147):
 * `settings.iconAssetId`, else the source-locale `site.logoImage`. `undefined`
 * → the builder draws a monogram. `apps/builder/src/site-icons.ts` picks the
 * same one, so what the head names is what the build wrote.
 */
export function getIconSource(snapshot: SiteSnapshot): MediaDoc | undefined {
  return getMedia(snapshot, snapshot.settings.iconAssetId) ?? getSiteLogo(snapshot);
}

/**
 * Whether the icon set has an `icon.svg` (decision 147): when the source is an
 * SVG (passed through, sanitised), or when there is none (the monogram is
 * drawn as one). A raster source has no `icon.svg`.
 */
export function hasSvgIcon(snapshot: SiteSnapshot): boolean {
  const source = getIconSource(snapshot);
  return !source || source.mime === 'image/svg+xml';
}

/** A theme colour role's value, by key (`paper`, `ink`, `accent`). */
export function themeColor(snapshot: SiteSnapshot, key: string, fallback: string): string {
  return snapshot.theme.colors.find((color) => color.key === key)?.value ?? fallback;
}

/**
 * The one theme colour a browser tab and an installed icon share:
 * `settings.themeColor`, else the theme's accent (its dark value for `dark`).
 */
export function themeColorValue(snapshot: SiteSnapshot, scheme: SiteColorScheme = 'light'): string {
  if (snapshot.settings.themeColor) return snapshot.settings.themeColor;
  const accent = themeColor(snapshot, 'accent', '#b0552f');
  if (scheme === 'light') return accent;
  return resolveDarkColors(snapshot.theme.colors).accent ?? accent;
}
