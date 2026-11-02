/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { HeadTag } from './head';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/**
 * What a page's `<head>` says about sharing it, as written — the one shape
 * both audit sources produce: the renderer's own head
 * (`headTagsToFacts`, inline health) and the builder's crawl of a deployed
 * page (parse5).
 *
 * **Raw, not normalised.** A missing `twitter:title` is absent here, never
 * filled from `og:title`: each platform's fallback is the evaluator's rule to
 * apply, and the facts must let it see what a scraper sees.
 */
export const shareFactsSchema = z.object({
  url: z.string(),
  locale: z.string().nullable(),
  lang: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  canonical: z.string().nullable(),
  robots: z.string().nullable(),
  hreflang: z.array(z.object({ lang: z.string(), href: z.string() })),
  /** Every `og:*` as written, repeats kept (`og:image` × n). */
  og: z.record(z.string(), z.array(z.string())),
  twitter: z.record(z.string(), z.string()),
  icons: z.array(
    z.object({
      rel: z.string(),
      href: z.string(),
      sizes: z.string().nullable(),
      type: z.string().nullable(),
    })
  ),
  themeColor: z.string().nullable(),
  jsonLdTypes: z.array(z.string()),
  /** The probed share image; the renderer does not probe, so `null` from `headTagsToFacts`. */
  image: z
    .object({
      url: z.string(),
      mime: z.string().nullable(),
      bytes: z.number().nullable(),
      width: z.number().nullable(),
      height: z.number().nullable(),
    })
    .nullable(),
});
export type ShareFacts = z.infer<typeof shareFactsSchema>;

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

const ICON_RELS = new Set(['icon', 'shortcut icon', 'apple-touch-icon', 'mask-icon']);

/** `@type` of every JSON-LD item a script carries (an array or a `@graph` included). */
function jsonLdTypes(source: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    return [];
  }
  const out: string[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value !== 'object' || value === null) return;
    const record = value as Record<string, unknown>;
    const type = record['@type'];
    if (typeof type === 'string') out.push(type);
    else if (Array.isArray(type))
      out.push(...type.filter((t): t is string => typeof t === 'string'));
    if (record['@graph']) visit(record['@graph']);
  };
  visit(parsed);
  return out;
}

/**
 * The share facts of a head the renderer wrote (`siteDocument`,
 * `rootStubHead`), for `url`; `lang` is the `<html lang>` beside it. The
 * first `<title>`, description, canonical, robots and theme colour win, as a
 * scraper reads them; `og:*` keeps every repeat in order; `twitter:*` keeps
 * the first of each.
 */
export function headTagsToFacts(tags: readonly HeadTag[], url: string, lang?: string): ShareFacts {
  const facts: ShareFacts = {
    url,
    locale: null,
    lang: lang ?? null,
    title: null,
    description: null,
    canonical: null,
    robots: null,
    hreflang: [],
    og: {},
    twitter: {},
    icons: [],
    themeColor: null,
    jsonLdTypes: [],
    image: null,
  };

  for (const tag of tags) {
    if (tag.tag === 'title') {
      facts.title ??= tag.text;
      continue;
    }
    if (tag.tag === 'script') {
      if (tag.attrs.type === 'application/ld+json' && tag.html) {
        facts.jsonLdTypes.push(...jsonLdTypes(tag.html));
      }
      continue;
    }
    const { attrs } = tag;
    if (tag.tag === 'link') {
      const rel = (attrs.rel ?? '').toLowerCase();
      const href = attrs.href;
      if (!href) continue;
      if (rel === 'canonical') facts.canonical ??= href;
      else if (rel === 'alternate' && attrs.hreflang) {
        facts.hreflang.push({ lang: attrs.hreflang, href });
      } else if (ICON_RELS.has(rel)) {
        facts.icons.push({ rel, href, sizes: attrs.sizes ?? null, type: attrs.type ?? null });
      }
      continue;
    }

    const content = attrs.content;
    if (content === undefined) continue;
    const property = attrs.property;
    const name = (attrs.name ?? '').toLowerCase();
    if (property?.startsWith('og:')) {
      (facts.og[property] ??= []).push(content);
      if (property === 'og:locale') facts.locale ??= content;
    } else if (name.startsWith('twitter:')) {
      facts.twitter[name] ??= content;
    } else if (name === 'description') facts.description ??= content;
    else if (name === 'robots') facts.robots ??= content;
    else if (name === 'theme-color') facts.themeColor ??= content;
  }
  return facts;
}
