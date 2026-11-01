/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { SiteSnapshot } from '../contracts';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** React's `createElement`, or anything satori accepts in its place. */
export type ElementFactory<T> = (
  type: string,
  props: { style: Record<string, string | number>; [attribute: string]: unknown } | null,
  ...children: (T | string | null)[]
) => T;

type CardSnapshot = Pick<
  SiteSnapshot,
  'project' | 'settings' | 'theme' | 'locales' | 'siteSlots' | 'content' | 'media'
>;

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

/*
 * The slot lookups are `routes.ts`'s, restated: this file stays import-free
 * (see below), and every field may be missing in a raw `snapshot.json`.
 */

function sourceContent(snapshot: Partial<CardSnapshot>, key: string): unknown {
  const locales = Array.isArray(snapshot.locales) ? snapshot.locales : [];
  const source = (locales.find((locale) => locale.isSource) ?? locales[0])?.code;
  const slot = (Array.isArray(snapshot.siteSlots) ? snapshot.siteSlots : []).find(
    (candidate) => candidate.key === key
  );
  if (!source || !slot) return undefined;
  return snapshot.content?.[source]?.[slot.id];
}

function sourceText(snapshot: Partial<CardSnapshot>, key: string): string | undefined {
  const value = sourceContent(snapshot, key) as { kind?: string; text?: unknown } | undefined;
  if (value?.kind !== 'text' && value?.kind !== 'heading') return undefined;
  return typeof value.text === 'string' && value.text.trim() ? value.text : undefined;
}

function sourceMedia(
  snapshot: Partial<CardSnapshot>,
  key: string
): { url: string; width?: number; height?: number } | undefined {
  const value = sourceContent(snapshot, key) as { kind?: string; assetId?: unknown } | undefined;
  if (value?.kind !== 'media' || typeof value.assetId !== 'string') return undefined;
  return snapshot.media?.[value.assetId];
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

const LOGO_HEIGHT = 96;
const LOGO_MAX_WIDTH = 480;

/**
 * The default social card (`/og.png`, 1200×630): the logo when the site has
 * one, the site name, the tagline (else the description), theme colours —
 * in the source locale, since a site has one `/og.png`. It returns the
 * element tree only — rasterising is the caller's (`next/og` in the Next
 * starter, satori + resvg in the kernel), so the renderer keeps its three
 * dependencies. `resolveSrc` turns the logo's URL into something the
 * rasteriser can read (a `data:` URL of the built file); without it, or when
 * it returns `null`, the card has no logo.
 *
 * Import-free on purpose: the starter's prebuild script loads this file with
 * Node's own type stripping, and takes the raw `snapshot.json`.
 */
export function ogImage<T>(
  snapshot: Partial<CardSnapshot>,
  h: ElementFactory<T>,
  options: { resolveSrc?: (url: string) => string | null } = {}
): { element: T; width: number; height: number } {
  const name =
    sourceText(snapshot, 'site.name') ??
    snapshot.settings?.siteName ??
    snapshot.project?.name ??
    'Site';
  const subtitle =
    sourceText(snapshot, 'site.tagline') ??
    sourceText(snapshot, 'seo.description') ??
    snapshot.settings?.description ??
    '';
  const colors = Array.isArray(snapshot.theme?.colors) ? snapshot.theme.colors : [];
  const color = (key: string, fallback: string) =>
    colors.find((entry) => entry.key === key)?.value ?? fallback;

  const logo = sourceMedia(snapshot, 'site.logoImage');
  const logoSrc = logo ? (options.resolveSrc?.(logo.url) ?? null) : null;
  const logoWidth =
    logo?.width && logo.height
      ? Math.min(LOGO_MAX_WIDTH, Math.round((LOGO_HEIGHT * logo.width) / logo.height))
      : LOGO_HEIGHT;

  const element = h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 72,
        background: color('paper', '#f4f1ea'),
        color: color('ink', '#1c1a17'),
      },
    },
    logoSrc
      ? h('img', {
          src: logoSrc,
          width: logoWidth,
          height: LOGO_HEIGHT,
          style: {
            width: logoWidth,
            height: LOGO_HEIGHT,
            objectFit: 'contain',
            marginBottom: 'auto',
          },
        })
      : null,
    h('div', {
      style: { width: 96, height: 8, background: color('accent', '#b0552f'), marginBottom: 32 },
    }),
    h('div', { style: { fontSize: 84, lineHeight: 1.05, letterSpacing: -2 } }, name),
    subtitle ? h('div', { style: { fontSize: 32, marginTop: 24, opacity: 0.7 } }, subtitle) : null
  );
  return { element, width: 1200, height: 630 };
}
