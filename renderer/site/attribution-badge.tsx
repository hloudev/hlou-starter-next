/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CSSProperties, ReactElement } from 'react';
import type { SiteAttribution, SiteAttributionTone } from '../contracts';
import { attributionMessages } from './messages';
import { ATTRIBUTION_FOOTER_METADATA_KEY, ATTRIBUTION_METADATA_KEY } from '../blocks/types';

import { siteAttributionSchema } from '../contracts';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** One shadow layer: its geometry (`0 2px 6px`, `inset 0 0 0 1px`) and its colour. */
export type AttributionShadowLayer = readonly [geometry: string, colour: string];

/** What the badge shows: the copy and the wordmark, the copy alone, or the H
 *  alone on its notched tile. */
export type AttributionMarkKind = 'logo' | 'none' | 'only';

/** The logo's colours on one side of a tone. Paper, ink or a single colour,
 *  never a gradient (brand book, decision 244). */
export type AttributionLogoColours = {
  /** The letters and the ball. */
  letters: string;
  paddles: string;
  /** The inside of the o. */
  counter: string;
};

/** One side (light or dark) of a tone, every value resolved. */
export type AttributionToneSide = {
  mark: AttributionMarkKind;
  logo: AttributionLogoColours;
  /** The H's tile, on `only`. */
  bg: string;
  fg: string;
  /** « Propulsé par ». Its opacity mutes are written as rgba of `fg`. */
  muted: string;
  /** « Hlou », on text-only: every other side draws the wordmark. */
  strong: string;
  shadow: readonly AttributionShadowLayer[];
  hoverShadow: readonly AttributionShadowLayer[];
  hoverBg: string;
  hoverFg: string;
  /** Glass: the backdrop blurs behind the badge. */
  blur: boolean;
};

/** The artifact's side keys: `TOD` and `MOD` are the dark sides of
 *  `text-only` and `mark-only`, new with the approved UI flow (2026-10-17). */
export type AttributionToneSideKey =
  'L' | 'D' | 'G' | 'B' | 'MI' | 'MP' | 'TO' | 'TOD' | 'MO' | 'MOD';

/** Where a site draws it — `footer`: in the Footer block's
 *  legal row · `row`: a row of its own after the content, when the page draws
 *  no footer (or a viewport-pinned badge, when the setting floats) · `static`:
 *  bare, for the settings previews and gallery, whatever holds it places it.
 *  The setting's `align` and `mode` say where on that line. */
export type AttributionPlacement = 'footer' | 'row' | 'static';

export type AttributionBadgeProps = {
  attribution: SiteAttribution;
  /** The page locale; picks the copy (English for an unknown one). */
  locale: string;
  /** Written on the badge when given; otherwise it inherits the page's. */
  dir?: 'ltr' | 'rtl';
  placement?: AttributionPlacement;
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** Where the badge links. One constant, so the real URL and UTM scheme land once. */
export const HLOU_ATTRIBUTION_HREF = 'https://hlou.site/?ref=badge';

/**
 * The logo's cells, as `@hlou/ui`'s `BrandTag` draws them: 24 × 8, the H a Pong
 * rally. A copy, because this package is vendored into the starter and its
 * colours are the badge's own, on a page with no app tokens.
 */
const LOGO_PADDLES = 'M0 1H2V8H0ZM4 0H6V7H4Z';
const LOGO_BALL = 'M2 3H4V5H2Z';
const LOGO_COUNTER = 'M13 3H15V7H13Z';
const LOGO_LETTERS =
  'M7 0H9V7H10V8H8V7H7ZM12 2H16V3H17V7H16V8H12V7H11V3H12ZM13 3V7H15V3ZM18 2H20V7H22V2H24V8H19V7H18Z';
const WORDMARK_VIEW_BOX = '0 0 24 8';
const WORDMARK_CELLS = { inline: 24, block: 8 } as const;
/** The brand book's mark, "the H on its own, in an ink square", on `BrandTag`'s
 *  notches. Its margin matters: lime reaching the edge melts into a paper page. */
const TILE_PATH = 'M-2 -2H8V-1H9V9H8V10H-2V9H-3V-1H-2Z';
const TILE_VIEW_BOX = '-3 -2 12 12';
const TILE_CELLS = 12;

/** The brand book's core colours, as `public/images/brand/*` holds them. */
const INK = '#101010';
const LIME = '#CCFC7C';
const WHITE = '#F9F9F9';

/** Decision 244: on paper all ink with a lime o, on ink lime paddles. */
const LOGO_ON_PAPER: AttributionLogoColours = { letters: INK, paddles: INK, counter: LIME };
const LOGO_ON_INK: AttributionLogoColours = {
  letters: WHITE,
  paddles: LIME,
  counter: 'transparent',
};
/** The brand book's rule for a colour or a photo: go single colour. */
const singleColour = (colour: string): AttributionLogoColours => ({
  letters: colour,
  paddles: colour,
  counter: 'transparent',
});

const LIGHT_RING: readonly AttributionShadowLayer[] = [
  ['0 0 0 1px', 'rgba(16,16,16,.1)'],
  ['0 2px 6px', 'rgba(16,16,16,.08)'],
];
const LIGHT_RING_HOVER: readonly AttributionShadowLayer[] = [
  ['0 0 0 1px', 'rgba(16,16,16,.18)'],
  ['0 4px 12px', 'rgba(16,16,16,.12)'],
];
const DARK_RING: readonly AttributionShadowLayer[] = [
  ['0 0 0 1px', 'rgba(249,249,249,.14)'],
  ['0 2px 8px', 'rgba(0,0,0,.4)'],
];

const LIGHT_SIDE = {
  logo: LOGO_ON_PAPER,
  bg: WHITE,
  fg: INK,
  muted: '#6B6A66',
  strong: INK,
  shadow: LIGHT_RING,
  hoverShadow: LIGHT_RING_HOVER,
  hoverBg: WHITE,
  hoverFg: INK,
  blur: false,
} as const;

const DARK_SIDE = {
  logo: LOGO_ON_INK,
  bg: INK,
  fg: WHITE,
  muted: '#989898',
  strong: WHITE,
  shadow: DARK_RING,
  hoverShadow: DARK_RING,
  hoverBg: '#1A1A1A',
  hoverFg: WHITE,
  blur: false,
} as const;

/**
 * Every side of every tone, in the brand book's colours. Shared by the site and
 * the settings UI's previews.
 */
export const ATTRIBUTION_TONE_SIDES: Readonly<
  Record<AttributionToneSideKey, Readonly<AttributionToneSide>>
> = {
  L: { mark: 'logo', ...LIGHT_SIDE },
  D: { mark: 'logo', ...DARK_SIDE },
  G: {
    mark: 'logo',
    logo: singleColour(WHITE),
    bg: 'rgba(249,249,249,.16)',
    fg: WHITE,
    muted: 'rgba(249,249,249,.78)',
    strong: WHITE,
    shadow: [['inset 0 0 0 1px', 'rgba(249,249,249,.22)']],
    hoverShadow: [['inset 0 0 0 1px', 'rgba(249,249,249,.22)']],
    hoverBg: 'rgba(249,249,249,.24)',
    hoverFg: WHITE,
    blur: true,
  },
  B: {
    mark: 'logo',
    logo: singleColour(INK),
    bg: LIME,
    fg: INK,
    muted: 'rgba(16,16,16,.72)',
    strong: INK,
    shadow: [['inset 0 0 0 1px', 'rgba(16,16,16,.14)']],
    hoverShadow: [['inset 0 0 0 1px', 'rgba(16,16,16,.28)']],
    hoverBg: '#E1FFB2',
    hoverFg: INK,
    blur: false,
  },
  MI: {
    mark: 'logo',
    logo: singleColour(INK),
    bg: 'transparent',
    fg: INK,
    muted: 'rgba(16,16,16,.62)',
    strong: INK,
    shadow: [['inset 0 0 0 1px', 'rgba(16,16,16,.22)']],
    hoverShadow: [['inset 0 0 0 1px', 'rgba(16,16,16,.5)']],
    hoverBg: 'transparent',
    hoverFg: INK,
    blur: false,
  },
  MP: {
    mark: 'logo',
    logo: singleColour(WHITE),
    bg: 'transparent',
    fg: WHITE,
    muted: 'rgba(249,249,249,.62)',
    strong: WHITE,
    shadow: [['inset 0 0 0 1px', 'rgba(249,249,249,.24)']],
    hoverShadow: [['inset 0 0 0 1px', 'rgba(249,249,249,.5)']],
    hoverBg: 'transparent',
    hoverFg: WHITE,
    blur: false,
  },
  TO: {
    mark: 'none',
    logo: singleColour(INK),
    bg: 'transparent',
    fg: '#55544F',
    muted: '#55544F',
    strong: INK,
    shadow: [],
    hoverShadow: [],
    hoverBg: 'transparent',
    hoverFg: INK,
    blur: false,
  },
  TOD: {
    mark: 'none',
    logo: singleColour(WHITE),
    bg: 'transparent',
    fg: '#989898',
    muted: '#989898',
    strong: WHITE,
    shadow: [],
    hoverShadow: [],
    hoverBg: 'transparent',
    hoverFg: WHITE,
    blur: false,
  },
  /* The H keeps the brand book's ink square on paper; on ink the same tile lifts
     to the grey the book draws it on there, so the page does not swallow it. */
  MO: {
    mark: 'only',
    ...DARK_SIDE,
    shadow: [],
    hoverShadow: [],
  },
  MOD: {
    mark: 'only',
    ...DARK_SIDE,
    bg: '#2A2A2A',
    shadow: [],
    hoverShadow: [],
    hoverBg: '#414141',
  },
};

/** A tone's own side, when it does not follow the page's scheme. */
const OWN: Readonly<Record<SiteAttributionTone, AttributionToneSideKey>> = {
  light: 'L',
  dark: 'D',
  glass: 'G',
  brand: 'B',
  'mono-ink': 'MI',
  'mono-paper': 'MP',
  'text-only': 'TO',
  'mark-only': 'MO',
};

/** A tone's [light, dark] sides when it follows the page's scheme. Glass and
 *  brand read the same on both, so they pair with themselves. */
const PAIR: Readonly<
  Record<SiteAttributionTone, readonly [AttributionToneSideKey, AttributionToneSideKey]>
> = {
  light: ['L', 'D'],
  dark: ['L', 'D'],
  glass: ['G', 'G'],
  brand: ['B', 'B'],
  'mono-ink': ['MI', 'MP'],
  'mono-paper': ['MI', 'MP'],
  'text-only': ['TO', 'TOD'],
  'mark-only': ['MO', 'MOD'],
};

/**
 * The sizes, on the logo's grid: `cell` is screen pixels per logo pixel, always
 * whole, and never under 2 (under 48 px wide the brand book wants the mark). The
 * heights and `gap`, `pe` leave the two logo pixels clear it asks for all round.
 * `ps` is the copy's side (inline-start), `pe` the logo's, and `drop` sets the copy
 * down onto the wordmark's baseline. `tile` is the H's cell.
 */
const SIZES = {
  s: { h: 24, fs: 11, cell: 2, gap: 5, ps: 10, pe: 8, drop: 3, tile: 2 },
  m: { h: 28, fs: 12, cell: 2, gap: 6, ps: 12, pe: 10, drop: 3, tile: 3 },
  l: { h: 36, fs: 13, cell: 3, gap: 7, ps: 14, pe: 11, drop: 6, tile: 4 },
} as const;

/** Text-only has no box, so it keeps a small even padding. */
const TEXT_ONLY_PADDING = 4;
const ROUNDED_RADIUS = '6px';
const PILL_RADIUS = '999px';

const BADGE_CLASS = 'hl-attribution';
const ROW_CLASS = 'hl-attribution-row';
const FLOAT_CLASS = 'hl-attribution-float';

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

/** One value per scheme: plain when both sides agree, `light-dark()` otherwise. */
function lightDark(light: string, dark: string): string {
  return light === dark ? light : `light-dark(${light},${dark})`;
}

function sameLayers(a: readonly AttributionShadowLayer[], b: readonly AttributionShadowLayer[]) {
  return (
    a.length === b.length && a.every((layer, i) => layer[0] === b[i]?.[0] && layer[1] === b[i]?.[1])
  );
}

/**
 * Two shadows, one per scheme, as one `box-shadow`. `light-dark()` only takes
 * colours, so the layers are combined one by one: the same geometry on both
 * sides keeps its geometry with a `light-dark()` colour; a layer only one side
 * has goes transparent on the other.
 */
function combineShadows(
  light: readonly AttributionShadowLayer[],
  dark: readonly AttributionShadowLayer[]
): string {
  if (sameLayers(light, dark)) {
    return light.length
      ? light.map(([geometry, colour]) => `${geometry} ${colour}`).join(',')
      : 'none';
  }
  const out: string[] = [];
  for (let i = 0; i < Math.max(light.length, dark.length); i++) {
    const a = light[i];
    const b = dark[i];
    if (a && b && a[0] === b[0]) out.push(`${a[0]} light-dark(${a[1]},${b[1]})`);
    else {
      if (a) out.push(`${a[0]} light-dark(${a[1]},transparent)`);
      if (b) out.push(`${b[0]} light-dark(transparent,${b[1]})`);
    }
  }
  return out.length ? out.join(',') : 'none';
}

/** The [light, dark] sides a setting draws with. */
export function attributionSides(
  attribution: Pick<SiteAttribution, 'tone' | 'adaptive'>
): readonly [AttributionToneSide, AttributionToneSide] {
  const [light, dark] = attribution.adaptive
    ? PAIR[attribution.tone]
    : [OWN[attribution.tone], OWN[attribution.tone]];
  return [ATTRIBUTION_TONE_SIDES[light], ATTRIBUTION_TONE_SIDES[dark]];
}

/**
 * The badge's custom properties. Every colour the stylesheet paints with
 * comes from here, so an adaptive badge follows the `color-scheme` of
 * whatever holds it — `.hl-site-scope` on a site (system, version pin,
 * theme toggle), a wrapper in the settings previews.
 */
export function attributionBadgeVars(attribution: SiteAttribution): Record<string, string> {
  const [light, dark] = attributionSides(attribution);
  const size = SIZES[attribution.size];
  const only = light.mark === 'only';
  const text = light.mark === 'none';
  const padStart = only ? 0 : text ? TEXT_ONLY_PADDING : size.ps;
  const padEnd = only ? 0 : text ? TEXT_ONLY_PADDING : size.pe;
  const tile = TILE_CELLS * size.tile;
  return {
    '--site-badge-h': `${only ? tile : size.h}px`,
    '--site-badge-fs': `${size.fs}px`,
    '--site-badge-logo-w': `${only ? tile : WORDMARK_CELLS.inline * size.cell}px`,
    '--site-badge-logo-h': `${only ? tile : WORDMARK_CELLS.block * size.cell}px`,
    '--site-badge-gap': `${size.gap}px`,
    '--site-badge-ps': `${padStart}px`,
    '--site-badge-pe': `${padEnd}px`,
    '--site-badge-drop': `${light.mark === 'logo' ? size.drop : 0}px`,
    '--site-badge-r': only ? '0' : attribution.shape === 'rounded' ? ROUNDED_RADIUS : PILL_RADIUS,
    '--site-badge-letters': lightDark(light.logo.letters, dark.logo.letters),
    '--site-badge-paddles': lightDark(light.logo.paddles, dark.logo.paddles),
    '--site-badge-counter': lightDark(light.logo.counter, dark.logo.counter),
    '--site-badge-bg': lightDark(light.bg, dark.bg),
    '--site-badge-fg': lightDark(light.fg, dark.fg),
    '--site-badge-muted': lightDark(light.muted, dark.muted),
    '--site-badge-strong': lightDark(light.strong, dark.strong),
    '--site-badge-shadow': combineShadows(light.shadow, dark.shadow),
    '--site-badge-shadow-h': combineShadows(light.hoverShadow, dark.hoverShadow),
    '--site-badge-bg-h': lightDark(light.hoverBg, dark.hoverBg),
    '--site-badge-fg-h': lightDark(light.hoverFg, dark.hoverFg),
  };
}

/**
 * The badge a Footer block draws in its legal row: the site's setting, when
 * `SiteRender` named this block as the one that carries it (the first
 * visible footer, `attributionFooter`). `null` for any other footer, in the
 * canvas, and when the badge is off — so a page shows it exactly once.
 */
export function readFooterAttribution(puck: unknown, id: string): SiteAttribution | null {
  if (typeof puck !== 'object' || puck === null || !('metadata' in puck)) return null;
  const metadata = puck.metadata;
  if (typeof metadata !== 'object' || metadata === null) return null;
  const record = metadata as Record<string, unknown>;
  if (record[ATTRIBUTION_FOOTER_METADATA_KEY] !== id) return null;
  const parsed = siteAttributionSchema.safeParse(record[ATTRIBUTION_METADATA_KEY]);
  return parsed.success && parsed.data.enabled ? parsed.data : null;
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

/** The wordmark, on the grid. Its colours are the badge's custom properties, so
 *  an adaptive badge swaps them with the page, and `crispEdges` keeps every logo
 *  pixel on screen pixels. */
function HlouWordmark(): ReactElement {
  return (
    <svg
      viewBox={WORDMARK_VIEW_BOX}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="var(--site-badge-paddles)" d={LOGO_PADDLES} />
      <path fill="var(--site-badge-letters)" d={LOGO_BALL} />
      <path fill="var(--site-badge-counter)" d={LOGO_COUNTER} />
      <path fill="var(--site-badge-letters)" fillRule="evenodd" d={LOGO_LETTERS} />
    </svg>
  );
}

/** The H alone on its notched tile. The tile is the whole badge: no dot around it,
 *  as the logo is never rounded. `styles/site.css` paints it, for the hover. */
function HlouTile(): ReactElement {
  return (
    <svg viewBox={TILE_VIEW_BOX} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path className={`${BADGE_CLASS}__tile`} d={TILE_PATH} />
      <path fill="var(--site-badge-paddles)" d={LOGO_PADDLES} />
      <path fill="var(--site-badge-letters)" d={LOGO_BALL} />
    </svg>
  );
}

/**
 * The « Propulsé par Hlou » badge: one plain link, no client script — a
 * kernel page's islands never see it. The tone travels as custom properties
 * (`attributionBadgeVars`); `styles/site.css` holds the static rules. The link's
 * label names it, so the logo is `aria-hidden`. Nothing when the setting is off.
 */
export function AttributionBadge({
  attribution,
  locale,
  dir,
  placement = 'static',
}: AttributionBadgeProps): ReactElement | null {
  if (!attribution.enabled) return null;

  const [side] = attributionSides(attribution);
  const copy = attributionMessages(locale);
  const className = [
    BADGE_CLASS,
    side.mark === 'only' ? `${BADGE_CLASS}--only` : '',
    side.mark === 'none' ? `${BADGE_CLASS}--text` : '',
    side.blur ? `${BADGE_CLASS}--glass` : '',
    placement === 'footer' ? `${BADGE_CLASS}--footer` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const badge = (
    <a
      className={className}
      href={HLOU_ATTRIBUTION_HREF}
      target="_blank"
      rel="noopener"
      lang={locale}
      dir={dir}
      aria-label={copy.label}
      title={copy.label}
      data-hl-attribution={attribution.tone}
      style={attributionBadgeVars(attribution) as CSSProperties}
    >
      {side.mark === 'only' ? (
        <HlouTile />
      ) : (
        <>
          <span className={`${BADGE_CLASS}__muted`}>{copy.poweredBy}</span>
          {side.mark === 'logo' ? (
            <HlouWordmark />
          ) : (
            <span className={`${BADGE_CLASS}__strong`}>{copy.brand}</span>
          )}
        </>
      )}
    </a>
  );

  if (placement === 'footer' || placement === 'static') return badge;

  /* The page's own line: a row of its own, aligned; or, floating, pinned to
     the viewport (`styles/site.css`). Physical offsets are logical here:
     `offsetX` is measured from the side `align` names, in the text direction. */
  if (attribution.mode === 'float') {
    return (
      <div
        className={FLOAT_CLASS}
        data-align={attribution.align}
        data-edge={attribution.edge}
        style={
          {
            '--site-badge-ox': `${attribution.offsetX}px`,
            '--site-badge-oy': `${attribution.offsetY}px`,
          } as CSSProperties
        }
      >
        {badge}
      </div>
    );
  }
  return (
    <div className={ROW_CLASS} data-align={attribution.align}>
      {badge}
    </div>
  );
}
