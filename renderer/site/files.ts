/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { SiteSnapshot } from '../contracts';
import type { SiteEnv } from './env';
import { absoluteUrl } from './env';
import { escapeHtml } from './head';
import {
  getSiteDescription,
  getSiteName,
  getSourceLocale,
  hasSvgIcon,
  localePath,
  siteRoutes,
  themeColor,
  themeColorValue,
} from './routes';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** Shaped as Next's `MetadataRoute.Sitemap[number]`, so the starter returns it as is. */
export type SitemapEntry = {
  url: string;
  changeFrequency: 'weekly' | 'monthly';
  priority: number;
  alternates: { languages: Record<string, string> };
};

/** Shaped as Next's `MetadataRoute.Robots`: one rule, allow or disallow. */
export type RobotsData = {
  rules: { userAgent: string; allow: string } | { userAgent: string; disallow: string };
  sitemap: string;
};

/** Shaped as Next's `MetadataRoute.Manifest`. */
export type WebManifest = {
  name: string;
  short_name: string;
  description?: string;
  start_url: string;
  display: 'standalone';
  background_color: string;
  theme_color: string;
  icons: { src: string; sizes: string; type: string; purpose?: 'maskable' }[];
};

/* -------------------------------------------------------------------------- */
/*                                   SITEMAP                                  */
/* -------------------------------------------------------------------------- */

/**
 * One entry per exported page; each carries every locale as an alternate. A
 * page marked `indexable: false` is left out — it is `noindex` anyway.
 */
export function sitemapEntries(snapshot: SiteSnapshot, env: SiteEnv): SitemapEntry[] {
  const defaultLocale = getSourceLocale(snapshot).code;
  const byPath = new Map<string, Set<string>>();
  for (const route of siteRoutes(snapshot)) {
    if (route.page.indexable === false) continue;
    const locales = byPath.get(route.path) ?? new Set<string>();
    locales.add(route.locale);
    byPath.set(route.path, locales);
  }

  const entries: SitemapEntry[] = [];
  for (const [path, locales] of byPath) {
    const languages: Record<string, string> = {};
    for (const locale of locales) languages[locale] = absoluteUrl(env, localePath(locale, path));
    const depth = path.split('/').filter(Boolean).length;
    for (const locale of locales) {
      entries.push({
        url: absoluteUrl(env, localePath(locale, path)),
        changeFrequency: path === '/' ? 'weekly' : 'monthly',
        priority: locale === defaultLocale ? (path === '/' ? 1 : depth > 1 ? 0.7 : 0.85) : 0.6,
        alternates: { languages },
      });
    }
  }
  return entries;
}

/** `sitemap.xml`, written the way Next writes it. */
export function sitemapXml(entries: readonly SitemapEntry[]): string {
  const urls = entries.map((entry) => {
    const alternates = Object.entries(entry.alternates.languages).map(
      ([hreflang, href]) =>
        `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeHtml(href)}" />\n`
    );
    return (
      `<url>\n<loc>${escapeHtml(entry.url)}</loc>\n${alternates.join('')}` +
      `<changefreq>${entry.changeFrequency}</changefreq>\n<priority>${entry.priority}</priority>\n</url>\n`
    );
  });
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.join('') +
    '</urlset>\n'
  );
}

/* -------------------------------------------------------------------------- */
/*                                   ROBOTS                                   */
/* -------------------------------------------------------------------------- */

/**
 * The site's crawl rule (decision 148): nothing on a preview build, nothing
 * when the site is set not to be indexed, everything otherwise.
 */
export function robotsData(env: SiteEnv, snapshot: SiteSnapshot): RobotsData {
  const closed = env.environment === 'preview' || snapshot.settings.indexable === false;
  return {
    rules: closed ? { userAgent: '*', disallow: '/' } : { userAgent: '*', allow: '/' },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}

/** `robots.txt`, written the way Next writes it. */
export function robotsTxt(data: RobotsData): string {
  const rule =
    'allow' in data.rules ? `Allow: ${data.rules.allow}` : `Disallow: ${data.rules.disallow}`;
  return `User-Agent: ${data.rules.userAgent}\n${rule}\n\nSitemap: ${data.sitemap}\n`;
}

/* -------------------------------------------------------------------------- */
/*                                  MANIFEST                                  */
/* -------------------------------------------------------------------------- */

/**
 * The install manifest: the generated PNGs (M30-3; both templates ship
 * fallbacks), the maskable one marked so, `icon.svg` when the set has one —
 * and the same theme colour the head names (`themeColorValue`).
 */
export function webManifest(snapshot: SiteSnapshot): WebManifest {
  const name = getSiteName(snapshot);
  return {
    name,
    short_name: name,
    description: getSiteDescription(snapshot),
    start_url: `/${getSourceLocale(snapshot).code}/`,
    display: 'standalone',
    background_color: themeColor(snapshot, 'paper', '#f4f1ea'),
    theme_color: themeColorValue(snapshot),
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ...(hasSvgIcon(snapshot) ? [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] : []),
    ],
  };
}
