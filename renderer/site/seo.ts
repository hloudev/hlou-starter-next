/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { PageDocV2, SiteColorScheme, SiteSnapshot } from '../contracts';
import type { SiteEnv } from './env';
import type { HeadTag } from './head';
import type { ResolvedRoute } from './routes';
import { resolveSiteUrl } from './env';
import { organizationJsonLd, serializeJsonLd, webPageJsonLd, webSiteJsonLd } from './jsonld';
import {
  getRecordText,
  getShareImage,
  getSiteDescription,
  getSiteName,
  getSiteTagline,
  getSlotText,
  getSourceLocale,
  hasSvgIcon,
  localePath,
  resolveRoute,
  themeColorValue,
} from './routes';
import { xHandle } from './social';

import { SITE_ROOT_CLASS, themeToCss } from '../theme';
import { SITE_SCHEME_SCRIPT } from '../theme/scheme';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type PageSeo = {
  title: string;
  description?: string;
  /** `true` when the page carries no `seo.title` of its own. */
  isSiteTitle: boolean;
};

type OgImage = { url: string; width?: number; height?: number; alt: string; type?: string };

type OpenGraph = {
  type: 'website';
  siteName: string;
  url?: string;
  locale: string;
  title: string;
  description?: string;
  images: OgImage[];
};

type Twitter = {
  card: 'summary_large_image';
  /** `@handle`, from `settings.social.x`. */
  site?: string;
  title: string;
  description?: string;
  images: { url: string; alt: string }[];
};

/** One `<link>` of the icon set (decision 147), shaped as Next's `IconDescriptor`. */
type IconLink = { url: string; sizes?: string; type?: string };

/**
 * A site's metadata, shaped as the subset of Next's `Metadata` it uses — so
 * the Next starter hands it over as is (`metadataBase` aside, a `URL` there),
 * and the kernel serialises the same values with `siteDocument`.
 */
export type SiteMetadata = {
  metadataBase: string;
  title?: string | { default: string; template: string } | { absolute: string };
  description?: string;
  applicationName?: string;
  alternates?: { canonical: string; languages: Record<string, string> };
  openGraph?: OpenGraph;
  twitter?: Twitter;
  robots?: { index: boolean; follow: boolean };
  icons?: { icon: IconLink[]; apple: IconLink[] };
};

export type SiteViewport = {
  themeColor: { media?: string; color: string }[];
  width: 'device-width';
  initialScale: 1;
};

/** What a `<html>` element carries: lang, dir, the theme on `:root`. */
export type SiteHtmlAttrs = {
  lang: string;
  dir: 'ltr' | 'rtl';
  className: string;
  style: Record<string, string>;
  /** Forces one palette (`data-site-scheme`); absent = follow the visitor's system. */
  scheme?: SiteColorScheme;
};

/* -------------------------------------------------------------------------- */
/*                                 PAGE SEO                                   */
/* -------------------------------------------------------------------------- */

/**
 * Title and description for one route in `locale`. SEO slots win
 * (`seo.title`, `seo.description`, `meta.description` on the page, then on
 * the site); a template page falls back to its record's `title` / `meta`;
 * the home page to the site name (with its tagline) and description; any
 * other page to its title.
 */
export function pageSeo(snapshot: SiteSnapshot, locale: string, route: ResolvedRoute): PageSeo {
  const { page, record, path } = route;
  const seoTitle = getSlotText(snapshot, locale, 'seo.title', page);
  const recordTitle = record ? getRecordText(snapshot, record, 'title', locale) : undefined;
  const title =
    seoTitle ?? recordTitle ?? (path === '/' ? homeTitle(snapshot, locale) : page.title);

  const description =
    getSlotText(snapshot, locale, 'seo.description', page) ??
    getSlotText(snapshot, locale, 'meta.description', page) ??
    (record ? getRecordText(snapshot, record, 'meta', locale) : undefined) ??
    (path === '/' ? getSiteDescription(snapshot, locale) : undefined);

  return { title, description, isSiteTitle: !seoTitle && path === '/' };
}

/** `Dar Zitouna — Maison d’hôtes à Tunis`: the site name, then its tagline when it has one. */
function homeTitle(snapshot: SiteSnapshot, locale: string): string {
  const name = getSiteName(snapshot, locale);
  const tagline = getSiteTagline(snapshot, locale);
  return tagline ? `${name} — ${tagline}` : name;
}

/* -------------------------------------------------------------------------- */
/*                                  METADATA                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_TITLE_TEMPLATE = '{page} — {site}';

/** The settings' template in Next's terms: `{site}` filled, `{page}` → `%s`. */
function titleTemplate(snapshot: SiteSnapshot, siteName: string): string {
  const template = snapshot.settings.titleTemplate?.includes('{page}')
    ? snapshot.settings.titleTemplate
    : DEFAULT_TITLE_TEMPLATE;
  return template.replaceAll('{site}', siteName).replaceAll('{page}', '%s');
}

/**
 * `<meta name=robots>` for a page (decision 148): a preview is never indexed
 * nor followed; production honours the site's `indexable`, then the page's.
 */
export function siteRobots(
  snapshot: SiteSnapshot,
  env: SiteEnv,
  page?: Pick<PageDocV2, 'indexable'>
): { index: boolean; follow: boolean } {
  if (env.environment === 'preview') return { index: false, follow: false };
  if (snapshot.settings.indexable === false || page?.indexable === false) {
    return { index: false, follow: true };
  }
  return { index: true, follow: true };
}

/**
 * The icon set the head names, in order: `/favicon.ico`, `/icon.svg` when the
 * set has one, `/apple-touch-icon.png`. The files are the build's (M30-3);
 * both templates ship fallbacks at the same paths.
 */
function siteIcons(snapshot: SiteSnapshot): NonNullable<SiteMetadata['icons']> {
  return {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      ...(hasSvgIcon(snapshot) ? [{ url: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] : []),
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  };
}

/** The route's share image, its alt falling back to `alt` (the page's title). */
function ogImages(
  snapshot: SiteSnapshot,
  locale: string,
  route: ResolvedRoute | undefined,
  alt: string
): OgImage[] {
  const image = getShareImage(snapshot, locale, route);
  return [{ ...image, alt: image.alt ?? alt }];
}

function twitterCard(
  snapshot: SiteSnapshot,
  input: { title: string; description?: string; images: OgImage[] }
): Twitter {
  const site = xHandle(snapshot.settings.social?.x);
  return {
    card: 'summary_large_image',
    ...(site ? { site } : {}),
    title: input.title,
    description: input.description,
    images: input.images.map((image) => ({ url: image.url, alt: image.alt })),
  };
}

/** Every page's defaults, whatever the route: the site name, the social card, robots, icons. */
export function layoutMetadata(snapshot: SiteSnapshot, env: SiteEnv, locale: string): SiteMetadata {
  const siteName = getSiteName(snapshot, locale);
  const description = getSiteDescription(snapshot, locale);
  const images = ogImages(snapshot, locale, undefined, siteName);
  return {
    metadataBase: env.siteUrl,
    title: { default: siteName, template: titleTemplate(snapshot, siteName) },
    description,
    applicationName: siteName,
    openGraph: { type: 'website', siteName, locale, title: siteName, description, images },
    twitter: twitterCard(snapshot, { title: siteName, description, images }),
    robots: siteRobots(snapshot, env),
    icons: siteIcons(snapshot),
  };
}

/**
 * One route's own metadata: title, description, canonical + hreflang, robots,
 * and its own Open Graph and X cards — complete, since a page's `openGraph`
 * and `twitter` each replace the layout's whole object.
 */
export function pageMetadata(
  snapshot: SiteSnapshot,
  env: SiteEnv,
  locale: string,
  route: ResolvedRoute
): Omit<SiteMetadata, 'metadataBase'> {
  const seo = pageSeo(snapshot, locale, route);
  const canonical = localePath(locale, route.path);
  const languages: Record<string, string> = {};
  for (const info of snapshot.locales) languages[info.code] = localePath(info.code, route.path);
  languages['x-default'] = localePath(getSourceLocale(snapshot).code, route.path);
  const images = ogImages(snapshot, locale, route, seo.title);

  return {
    title: seo.isSiteTitle ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates: { canonical, languages },
    robots: siteRobots(snapshot, env, route.page),
    openGraph: {
      type: 'website',
      siteName: getSiteName(snapshot, locale),
      url: canonical,
      title: seo.title,
      description: seo.description,
      locale,
      images,
    },
    twitter: twitterCard(snapshot, { title: seo.title, description: seo.description, images }),
  };
}

/**
 * The bare domain's redirect stub (`/` → `/<source>/`) — the URL people paste
 * most, so it carries the home page's title, description, Open Graph and X
 * cards and the icons, `og:url` naming the home it forwards to. Never indexed.
 */
export function rootStubMetadata(snapshot: SiteSnapshot, env: SiteEnv): SiteMetadata {
  const locale = getSourceLocale(snapshot).code;
  const layout = layoutMetadata(snapshot, env, locale);
  const home = resolveRoute(snapshot, '/');
  const page = home ? pageMetadata(snapshot, env, locale, home) : undefined;
  const og = page?.openGraph ?? layout.openGraph;
  return {
    metadataBase: env.siteUrl,
    title: { absolute: resolveTitle(layout.title, page?.title) },
    description: page ? page.description : layout.description,
    robots: { index: false, follow: true },
    ...(og ? { openGraph: { ...og, url: localePath(locale, '/') } } : {}),
    twitter: page?.twitter ?? layout.twitter,
    icons: layout.icons,
  };
}

/**
 * The browser chrome's colour — the same one the manifest names
 * (`themeColorValue`). A dark variant only when the colour is the theme's
 * own accent; a colour the agency chose is the colour, in both schemes.
 */
export function siteViewport(snapshot: SiteSnapshot): SiteViewport {
  const themeColor = snapshot.settings.themeColor
    ? [{ color: snapshot.settings.themeColor }]
    : [
        { media: '(prefers-color-scheme: light)', color: themeColorValue(snapshot, 'light') },
        { media: '(prefers-color-scheme: dark)', color: themeColorValue(snapshot, 'dark') },
      ];
  return { themeColor, width: 'device-width', initialScale: 1 };
}

/** `<html lang dir class style>` for a locale: the theme lands on `:root`. */
export function siteHtmlAttrs(snapshot: SiteSnapshot, locale: string): SiteHtmlAttrs {
  return {
    lang: locale,
    dir: snapshot.locales.find((info) => info.code === locale)?.dir === 'rtl' ? 'rtl' : 'ltr',
    className: SITE_ROOT_CLASS,
    style: themeToCss(snapshot.theme, locale),
    ...(snapshot.colorScheme ? { scheme: snapshot.colorScheme } : {}),
  };
}

/** The JSON-LD a route carries: `WebSite`, `Organization`, `WebPage`. */
export function pageJsonLd(
  snapshot: SiteSnapshot,
  env: SiteEnv,
  locale: string,
  route: ResolvedRoute
): string {
  const seo = pageSeo(snapshot, locale, route);
  return serializeJsonLd([
    webSiteJsonLd(snapshot, env, locale),
    organizationJsonLd(snapshot, env, locale),
    webPageJsonLd(env, {
      locale,
      path: route.path,
      title: seo.title,
      description: seo.description,
    }),
  ]);
}

/* -------------------------------------------------------------------------- */
/*                                  DOCUMENT                                  */
/* -------------------------------------------------------------------------- */

function resolveTitle(layout: SiteMetadata['title'], page: SiteMetadata['title']): string {
  const template =
    layout && typeof layout === 'object' && 'template' in layout ? layout.template : '%s';
  const fallback =
    layout && typeof layout === 'object' && 'default' in layout ? layout.default : '';
  if (page === undefined) return fallback;
  if (typeof page === 'string') return template.replace('%s', page);
  if ('absolute' in page) return page.absolute;
  return 'default' in page ? page.default : fallback;
}

/**
 * Resolved metadata as head tags, in Next's order: the part after the
 * viewport, title first. `title` is already resolved (template applied).
 */
function metadataTags(
  env: SiteEnv,
  metadata: Omit<SiteMetadata, 'metadataBase' | 'title'> & { title?: string }
): HeadTag[] {
  const head: HeadTag[] = [];
  const meta = (attrs: Record<string, string>) => head.push({ tag: 'meta', attrs });
  const link = (attrs: Record<string, string>) => head.push({ tag: 'link', attrs });
  const { description, openGraph: og, twitter, robots, alternates, icons } = metadata;

  if (metadata.title !== undefined) head.push({ tag: 'title', text: metadata.title });
  if (description) meta({ name: 'description', content: description });
  if (metadata.applicationName) {
    meta({ name: 'application-name', content: metadata.applicationName });
  }
  link({ rel: 'manifest', href: '/manifest.webmanifest' });
  if (robots) {
    meta({
      name: 'robots',
      content: `${robots.index ? 'index' : 'noindex'}, ${robots.follow ? 'follow' : 'nofollow'}`,
    });
  }
  if (alternates) {
    link({ rel: 'canonical', href: resolveSiteUrl(env, alternates.canonical) });
    for (const [hreflang, href] of Object.entries(alternates.languages)) {
      link({ rel: 'alternate', hreflang, href: resolveSiteUrl(env, href) });
    }
  }
  if (og) {
    meta({ property: 'og:title', content: og.title });
    if (og.description) meta({ property: 'og:description', content: og.description });
    if (og.url) meta({ property: 'og:url', content: resolveSiteUrl(env, og.url) });
    meta({ property: 'og:site_name', content: og.siteName });
    meta({ property: 'og:locale', content: og.locale });
    for (const image of og.images) {
      meta({ property: 'og:image', content: resolveSiteUrl(env, image.url) });
      if (image.type) meta({ property: 'og:image:type', content: image.type });
      if (image.width) meta({ property: 'og:image:width', content: String(image.width) });
      if (image.height) meta({ property: 'og:image:height', content: String(image.height) });
      if (image.alt) meta({ property: 'og:image:alt', content: image.alt });
    }
    meta({ property: 'og:type', content: og.type });
  }
  if (twitter) {
    meta({ name: 'twitter:card', content: twitter.card });
    if (twitter.site) meta({ name: 'twitter:site', content: twitter.site });
    meta({ name: 'twitter:title', content: twitter.title });
    if (twitter.description) meta({ name: 'twitter:description', content: twitter.description });
    for (const image of twitter.images) {
      meta({ name: 'twitter:image', content: resolveSiteUrl(env, image.url) });
      if (image.alt) meta({ name: 'twitter:image:alt', content: image.alt });
    }
  }
  if (icons) {
    for (const icon of icons.icon) link({ rel: 'icon', href: icon.url, ...iconAttrs(icon) });
    for (const icon of icons.apple) {
      link({ rel: 'apple-touch-icon', href: icon.url, ...iconAttrs(icon) });
    }
  }
  return head;
}

function iconAttrs(icon: IconLink): Record<string, string> {
  return {
    ...(icon.sizes ? { sizes: icon.sizes } : {}),
    ...(icon.type ? { type: icon.type } : {}),
  };
}

const CHARSET: HeadTag = { tag: 'meta', attrs: { charset: 'utf-8' } };
const VIEWPORT: HeadTag = {
  tag: 'meta',
  attrs: { name: 'viewport', content: 'width=device-width, initial-scale=1' },
};

/**
 * A route's whole `<head>` and `<html>` attributes, framework-free — the
 * layout's and the page's metadata merged the way Next merges them (key by
 * key: the page's `openGraph`, `twitter` and `robots` replace the layout's),
 * then written in Next's tag order.
 */
export function siteDocument(input: {
  snapshot: SiteSnapshot;
  env: SiteEnv;
  locale: string;
  route: ResolvedRoute;
}): { htmlAttrs: SiteHtmlAttrs; head: HeadTag[] } {
  const { snapshot, env, locale, route } = input;
  const layout = layoutMetadata(snapshot, env, locale);
  const page = pageMetadata(snapshot, env, locale, route);
  const viewport = siteViewport(snapshot);

  const head: HeadTag[] = [
    CHARSET,
    VIEWPORT,
    ...viewport.themeColor.map((entry): HeadTag => ({
      tag: 'meta',
      attrs: {
        name: 'theme-color',
        content: entry.color,
        ...(entry.media ? { media: entry.media } : {}),
      },
    })),
    ...metadataTags(env, {
      title: resolveTitle(layout.title, page.title),
      /* Next merges key by key: a page that names `description`, even as
         undefined, replaces the layout's — so a page without one has none. */
      description: 'description' in page ? page.description : layout.description,
      applicationName: layout.applicationName,
      robots: page.robots ?? layout.robots,
      alternates: page.alternates,
      openGraph: page.openGraph ?? layout.openGraph,
      twitter: page.twitter ?? layout.twitter,
      icons: layout.icons,
    }),
    { tag: 'script', attrs: {}, html: SITE_SCHEME_SCRIPT },
  ];

  return { htmlAttrs: siteHtmlAttrs(snapshot, locale), head };
}

/**
 * The bare domain's stub head (`rootStubMetadata` as tags) — charset,
 * viewport, then the home page's share tags. The caller adds the refresh.
 */
export function rootStubHead(snapshot: SiteSnapshot, env: SiteEnv): HeadTag[] {
  const { metadataBase: _base, title, ...metadata } = rootStubMetadata(snapshot, env);
  return [
    CHARSET,
    VIEWPORT,
    ...metadataTags(env, { ...metadata, title: resolveTitle(undefined, title) }),
  ];
}
