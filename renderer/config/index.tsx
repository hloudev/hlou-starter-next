/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CSSProperties, ReactElement, ReactNode } from 'react';
import type { BlockKey } from '../blocks';
import type { RenderMode } from '../blocks/types';
import type { MediaDoc } from '../contracts';
import type { CustomFieldKind, CustomFieldRenderer, CustomFieldRenderers } from './fields';
import type { SiteBlockConfig, SiteField, SiteRenderConfig } from './types';
import { defaultFieldRenderers } from './default-fields';
import { zodObjectToFields } from './fields';
import {
  ATTRIBUTION_FOOTER_METADATA_KEY,
  ATTRIBUTION_METADATA_KEY,
  readRenderContext,
  THEME_METADATA_KEY,
} from '../blocks/types';

import { BLOCK_KEYS, blockRegistry } from '../blocks';
import { applyDesign } from '../blocks/design';
import { siteAttributionSchema, siteThemeTokensSchema } from '../contracts';
import { AttributionBadge } from '../site/attribution-badge';
import { schemesCss, SITE_SCOPE_CLASS, themeToCss } from '../theme';
import { fontFaceCss, fontPreloads, googleFontsHref, resolveFontsForLocale } from '../theme/fonts';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type SiteConfigOptions = {
  /** `static` drops the canvas-only blocks (the section placeholder). */
  mode?: RenderMode;
  /** Replace the standalone field editors with the app's inspector. */
  fieldOverrides?: Partial<Record<CustomFieldKind, CustomFieldRenderer>>;
};

/* Declared beside the render context, so a block can read them too. */
export { ATTRIBUTION_FOOTER_METADATA_KEY, ATTRIBUTION_METADATA_KEY, THEME_METADATA_KEY };
/** Where `SiteRender` (and the Design canvas) put `snapshot.media` — the same
 *  map a resolved `ResolvedMedia` prop's `url` already comes from, keyed by
 *  asset id, read here to resolve a `source: 'custom'` font role's `assetId`
 *  into a URL (`fontFaceCss`'s `resolveAssetUrl`). */
export const SITE_MEDIA_METADATA_KEY = 'hlSiteMedia';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * The scope boundary. Root render for both the editor's iframe and the
 * published page: `.hl-site-scope`, `lang`, `dir`, and the theme as inline
 * custom properties. Metadata is the only channel that reaches this in a
 * server component.
 */
function SiteRoot({ children, puck }: { children: ReactNode; puck?: unknown }): ReactElement {
  const context = readRenderContext(puck);
  const metadata = isRecord(puck) && isRecord(puck.metadata) ? puck.metadata : {};
  const rawTheme = metadata[THEME_METADATA_KEY];
  const style = themeToCss(rawTheme, context.locale) as unknown as CSSProperties;

  /* One shared render path for font loading: the same computation the
     canvas, the Preview stage and the published build (`hlou-starter-next`'s
     `[locale]/layout.tsx` renders through this same `SiteRoot`, vendored) all
     resolve through, instead of the canvas's own imperative `<link>`
     injection this replaces. `media` is
     `snapshot.media` (set alongside the theme by `SiteRender` and the
     canvas) — the same already-correct URL every other `ResolvedMedia` prop
     resolves through (session-gated in canvas/preview, the rewritten static
     `/media/<id>/<file>` path in a published build).
     `resolveFontsForLocale` resolves each role's `localeOverrides` against
     THIS page's own locale before either loader runs, so a page only ever
     requests the font it actually renders with — never every locale's font
     on every page. */
  const rawMedia = metadata[SITE_MEDIA_METADATA_KEY];
  const media = isRecord(rawMedia) ? (rawMedia as Record<string, MediaDoc>) : {};
  const resolveAssetUrl = (assetId: string) => media[assetId]?.url ?? null;

  const parsedTheme = siteThemeTokensSchema.safeParse(rawTheme ?? {});
  const fonts = resolveFontsForLocale(
    parsedTheme.success ? parsedTheme.data.fonts : [],
    context.locale
  );
  const fontsHref = googleFontsHref(fonts);
  const fontFace = fontFaceCss(fonts, resolveAssetUrl);
  const preloads = fontPreloads(fonts, resolveAssetUrl);
  /* One rule per colour scheme a section can sit on. */
  const schemes = schemesCss(rawTheme);
  /* The « Propulsé par Hlou » badge, when the page draws no visible footer
     to carry it: a centred row after the content, inside the
     scope so it takes its theme, scheme, `lang` and `dir`. With a footer,
     `FooterBlock` draws it in its legal row instead — never both. The Design
     canvas never shows it: every Canvas path renders with `mode="canvas"`
     (`DocFrame.tsx`'s FrameContent, `CanvasEditor`'s measurer) and
     `SiteRender` only sets the key outside that mode. */
  const attribution = siteAttributionSchema.safeParse(metadata[ATTRIBUTION_METADATA_KEY]);
  const inFooter = typeof metadata[ATTRIBUTION_FOOTER_METADATA_KEY] === 'string';

  return (
    <div
      className={SITE_SCOPE_CLASS}
      lang={context.locale}
      dir={context.dir}
      style={style}
      data-site-scheme={context.colorScheme}
    >
      {/* React 19 lifts these `<link>`s into the document's `<head>` (the
          start of the HTML for the kernel's fragment render), so the font
          files download before layout instead of after it — no fallback
          face flashing on every full page load. `crossOrigin` is required:
          `@font-face` fetches in CORS mode, and a preload without it is
          fetched twice. The Google stylesheet itself stays here (a
          stylesheet `<link>` without `precedence` is not lifted). */}
      {fontsHref ? (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="stylesheet" href={fontsHref} />
        </>
      ) : null}
      {preloads.map((font) => (
        <link
          key={font.href}
          rel="preload"
          as="font"
          href={font.href}
          type={font.type}
          crossOrigin="anonymous"
        />
      ))}
      {fontFace ? <style>{fontFace}</style> : null}
      {schemes ? <style data-hl-schemes="">{schemes}</style> : null}
      {children}
      {attribution.success && !inFooter ? (
        <AttributionBadge
          attribution={attribution.data}
          locale={context.locale}
          dir={context.dir}
          placement="row"
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * The block config, generated from the block registry — never hand-kept.
 * Zod props become fields; bound / collection / form / richtext / media
 * props become `custom` fields whose renderer the app can override.
 * `renderDoc` draws a document with it.
 */
export function createSiteConfig(options: SiteConfigOptions = {}): SiteRenderConfig {
  const renderers: CustomFieldRenderers = { ...defaultFieldRenderers, ...options.fieldOverrides };

  const components: Record<string, SiteBlockConfig> = {};
  const categories: NonNullable<SiteRenderConfig['categories']> = {};

  for (const key of BLOCK_KEYS) {
    const block = blockRegistry[key];
    const fields: Record<string, SiteField> = zodObjectToFields(block.schema, renderers);
    components[key] = {
      label: block.label,
      fields,
      defaultProps: block.defaults,
      /* The node's variant and design choices land here. */
      render: (props) => block.Component(applyDesign(key, props)),
    };
    /* The title is the category KEY; the Design palette translates it. */
    const category = (categories[block.category] ??= {
      title: block.category,
      components: [],
    });
    category.components?.push(key);
  }

  return {
    categories,
    components,
    root: {
      fields: {},
      render: ({ children, puck }: { children: ReactNode; puck?: unknown }) => (
        <SiteRoot puck={puck}>{children}</SiteRoot>
      ),
    },
  };
}

const configCache = new Map<RenderMode, SiteRenderConfig>();

/** The config for a mode with the standalone field editors, built once. */
export function getSiteConfig(mode: RenderMode): SiteRenderConfig {
  let config = configCache.get(mode);
  if (!config) {
    config = createSiteConfig({ mode });
    configCache.set(mode, config);
  }
  return config;
}

export const siteConfig: SiteRenderConfig = getSiteConfig('canvas');

export type { CustomFieldKind, CustomFieldRenderer, CustomFieldRenderProps } from './fields';
export type * from './types';
export { humanize, zodToField, zodObjectToFields } from './fields';
export { defaultFieldRenderers } from './default-fields';
export type { BlockKey };
