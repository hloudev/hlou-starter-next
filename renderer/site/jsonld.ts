/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { SiteSnapshot } from '../contracts';
import type { SiteEnv } from './env';
import { absoluteUrl, resolveSiteUrl } from './env';
import { getSiteDescription, getSiteLogo, getSiteName, getSourceLocale } from './routes';
import { socialProfileUrls } from './social';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type JsonLd = Record<string, unknown> & {
  '@context': 'https://schema.org';
};

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * `Organization` for the site owner — emitted once per page. `logo` is the
 * source locale's `site.logoImage` (Google wants one stable logo), `sameAs`
 * the site's social profiles.
 */
export function organizationJsonLd(snapshot: SiteSnapshot, env: SiteEnv, locale?: string): JsonLd {
  const logo = getSiteLogo(snapshot, getSourceLocale(snapshot).code);
  const description = getSiteDescription(snapshot, locale);
  const sameAs = socialProfileUrls(snapshot.settings.social);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: getSiteName(snapshot, locale),
    url: env.siteUrl,
    ...(logo ? { logo: resolveSiteUrl(env, logo.url) } : {}),
    ...(description ? { description } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/** `WebSite` with every locale's home as `inLanguage` alternates. */
export function webSiteJsonLd(snapshot: SiteSnapshot, env: SiteEnv, locale: string): JsonLd {
  const description = getSiteDescription(snapshot, locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: getSiteName(snapshot, locale),
    url: absoluteUrl(env, `/${locale}`),
    inLanguage: snapshot.locales.map((info) => info.code),
    ...(description ? { description } : {}),
  };
}

/** `WebPage` for one rendered route. */
export function webPageJsonLd(
  env: SiteEnv,
  input: { locale: string; path: string; title: string; description?: string }
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: input.title,
    url: absoluteUrl(env, `/${input.locale}${input.path === '/' ? '' : input.path}`),
    inLanguage: input.locale,
    isPartOf: { '@type': 'WebSite', url: absoluteUrl(env, `/${input.locale}`) },
    ...(input.description ? { description: input.description } : {}),
  };
}

/** Serialised for a `<script type="application/ld+json">`; `<` escaped so a title can't close the tag. */
export function serializeJsonLd(items: JsonLd[]): string {
  return JSON.stringify(items.length === 1 ? items[0] : items).replace(/</g, '\\u003c');
}
