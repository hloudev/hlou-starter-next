/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { useId } from 'react';

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

/** What the badge shows before the copy: the gradient mark, the mark in the
 *  text colour, nothing, or the gradient mark alone in a dot. */
export type AttributionMarkKind = 'color' | 'mono' | 'none' | 'only';

/** One side (light or dark) of a tone, every value resolved. */
export type AttributionToneSide = {
  mark: AttributionMarkKind;
  bg: string;
  fg: string;
  /** « Propulsé par ». The handoff's opacity mutes are written as rgba of `fg`. */
  muted: string;
  /** « Hlou ». */
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

/** Where a site draws it (decision 193) — `footer`: at the end of the Footer
 *  block's legal row · `row`: a centred row of its own after the content, when
 *  the page draws no footer · `static`: bare, for the settings previews and
 *  gallery, whatever holds it places it. Never fixed to the viewport. */
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
export const HLOU_ATTRIBUTION_HREF = 'https://hlou.app/?ref=badge';

/** The Hlou mark (512×338), from the handoff's reference script. */
const MARK_PATH =
  'M192.0 173.0C190.3 173.0 176.6 172.3 174.0 173.0C171.4 173.7 169.7 169.3 164.0 181.0C158.3 192.7 118.0 288.4 112.0 301.0C106.0 313.6 101.2 316.5 99.0 319.0C96.8 321.5 89.7 326.8 88.0 328.0C86.3 329.2 82.9 331.3 81.0 332.0C79.1 332.7 70.1 335.6 67.0 336.0C63.9 336.4 50.1 336.4 47.0 336.0C43.9 335.6 35.5 333.1 33.0 332.0C30.5 330.9 21.9 325.5 20.0 324.0C18.1 322.5 13.7 318.5 12.0 316.0C10.3 313.5 3.1 299.6 2.0 297.0C0.9 294.4 0.2 290.4 0.0 288.0C-0.2 285.6 -0.4 274.1 0.0 271.0C0.4 267.9 -5.0 275.6 4.0 254.0C13.0 232.4 88.8 56.0 98.0 35.0C107.2 14.0 102.3 27.1 104.0 25.0C105.7 22.9 114.1 14.1 117.0 12.0C119.9 9.9 133.2 3.1 136.0 2.0C138.8 0.9 145.1 0.1 148.0 0.0C150.9 -0.1 165.0 0.5 168.0 1.0C171.0 1.5 178.3 3.7 181.0 5.0C183.7 6.3 194.6 13.0 197.0 15.0C199.4 17.0 205.3 24.3 207.0 27.0C208.7 29.7 214.0 40.4 215.0 44.0C216.0 47.6 218.0 62.3 218.0 66.0C218.0 69.7 216.4 80.1 215.0 84.0C213.6 87.9 204.1 105.7 203.0 109.0C201.9 112.3 202.4 118.1 203.0 120.0C203.6 121.9 208.0 128.3 210.0 130.0C212.0 131.7 222.2 137.4 225.0 138.0C227.8 138.6 237.8 137.9 240.0 137.0C242.2 136.1 244.1 138.1 249.0 128.0C253.9 117.9 288.5 37.7 294.0 27.0C299.5 16.3 305.9 13.3 309.0 11.0C312.1 8.7 323.9 2.9 328.0 2.0C332.1 1.1 350.3 0.7 354.0 1.0C357.7 1.3 365.5 3.9 368.0 5.0C370.5 6.1 379.0 11.4 381.0 13.0C383.0 14.6 388.3 19.6 390.0 22.0C391.7 24.4 398.7 36.1 400.0 39.0C401.3 41.9 403.6 50.6 404.0 54.0C404.4 57.4 404.6 72.0 404.0 76.0C403.4 80.0 400.9 88.7 397.0 98.0C393.1 107.3 364.3 170.1 361.0 178.0C357.7 185.9 360.4 181.7 361.0 184.0C361.6 186.3 366.2 199.9 368.0 203.0C369.8 206.1 378.9 216.1 381.0 218.0C383.1 219.9 389.4 223.3 391.0 224.0C392.6 224.7 396.9 225.9 399.0 226.0C401.1 226.1 411.2 225.8 414.0 225.0C416.8 224.2 426.6 218.0 429.0 217.0C431.4 216.0 437.2 214.3 440.0 214.0C442.8 213.7 457.2 213.7 460.0 214.0C462.8 214.3 469.1 216.3 471.0 217.0C472.9 217.7 479.0 220.6 481.0 222.0C483.0 223.4 491.2 230.2 493.0 232.0C494.8 233.8 499.5 239.3 501.0 242.0C502.5 244.7 508.1 257.7 509.0 261.0C509.9 264.3 510.9 275.4 511.0 278.0C511.1 280.6 510.7 286.2 510.0 289.0C509.3 291.8 504.8 304.8 503.0 308.0C501.2 311.2 491.8 322.1 490.0 324.0C488.2 325.9 484.9 328.0 483.0 329.0C481.1 330.0 471.3 334.3 469.0 335.0C466.7 335.7 461.0 336.9 458.0 337.0C455.0 337.1 438.9 336.4 436.0 336.0C433.1 335.6 428.0 333.9 426.0 333.0C424.0 332.1 416.6 328.2 414.0 326.0C411.4 323.8 400.1 311.9 398.0 309.0C395.9 306.1 391.9 296.8 391.0 294.0C390.1 291.2 388.6 280.2 388.0 278.0C387.4 275.8 385.1 271.5 384.0 270.0C382.9 268.5 377.5 263.2 376.0 262.0C374.5 260.8 369.9 257.8 368.0 257.0C366.1 256.2 357.7 253.4 355.0 253.0C352.3 252.6 341.2 252.8 339.0 253.0C336.8 253.2 332.6 254.3 331.0 255.0C329.4 255.7 322.6 259.7 321.0 261.0C319.4 262.3 316.3 264.6 314.0 269.0C311.7 273.4 298.3 304.5 296.0 309.0C293.7 313.5 290.7 316.3 289.0 318.0C287.3 319.7 279.7 326.4 277.0 328.0C274.3 329.6 264.0 334.4 260.0 335.0C256.0 335.6 236.5 334.5 233.0 334.0C229.5 333.5 223.8 330.9 222.0 330.0C220.2 329.1 214.9 325.8 213.0 324.0C211.1 322.2 202.7 312.7 201.0 310.0C199.3 307.3 194.6 299.0 194.0 295.0C193.4 291.0 191.9 273.4 194.0 266.0C196.1 258.6 214.7 219.3 217.0 214.0C219.3 208.7 218.8 209.5 219.0 208.0C219.2 206.5 219.3 199.7 219.0 198.0C218.7 196.3 217.2 191.7 216.0 190.0C214.8 188.3 208.1 180.6 206.0 179.0C203.9 177.4 194.3 173.6 193.0 173.0C191.7 172.4 193.7 173.0 192.0 173.0Z';
const MARK_VIEW_BOX = '0 0 512 338';
/** Diagonal, bottom-left to top-right. */
const MARK_STOPS: ReadonlyArray<readonly [offset: string, colour: string]> = [
  ['0', '#3448dc'],
  ['.38', '#4b8ecb'],
  ['.68', '#a37ec9'],
  ['1', '#f3705e'],
];

const LIGHT_RING: readonly AttributionShadowLayer[] = [
  ['0 0 0 1px', 'rgba(20,22,35,.08)'],
  ['0 2px 6px', 'rgba(20,22,35,.08)'],
];
const LIGHT_RING_HOVER: readonly AttributionShadowLayer[] = [
  ['0 0 0 1px', 'rgba(20,22,35,.14)'],
  ['0 4px 12px', 'rgba(20,22,35,.12)'],
];
const DARK_RING: readonly AttributionShadowLayer[] = [
  ['0 0 0 1px', 'rgba(255,255,255,.08)'],
  ['0 2px 8px', 'rgba(0,0,0,.4)'],
];

const LIGHT_SIDE = {
  bg: '#FFFFFF',
  fg: '#1B1C24',
  muted: '#6B6D7A',
  strong: '#1B1C24',
  shadow: LIGHT_RING,
  hoverShadow: LIGHT_RING_HOVER,
  hoverBg: '#FFFFFF',
  hoverFg: '#1B1C24',
  blur: false,
} as const;

const DARK_SIDE = {
  bg: '#1C1D26',
  fg: '#ECECF1',
  muted: '#9A9CAA',
  strong: '#ECECF1',
  shadow: DARK_RING,
  hoverShadow: DARK_RING,
  hoverBg: '#24252F',
  hoverFg: '#ECECF1',
  blur: false,
} as const;

/**
 * Every side of every tone, exactly as the Claude Design handoff and the
 * approved « Badge Hlou » flow give them. Shared by the site and the settings
 * UI's previews.
 */
export const ATTRIBUTION_TONE_SIDES: Readonly<
  Record<AttributionToneSideKey, Readonly<AttributionToneSide>>
> = {
  L: { mark: 'color', ...LIGHT_SIDE },
  D: { mark: 'color', ...DARK_SIDE },
  G: {
    mark: 'mono',
    bg: 'rgba(255,255,255,.16)',
    fg: '#FFFFFF',
    muted: 'rgba(255,255,255,.78)',
    strong: '#FFFFFF',
    shadow: [['inset 0 0 0 1px', 'rgba(255,255,255,.22)']],
    hoverShadow: [['inset 0 0 0 1px', 'rgba(255,255,255,.22)']],
    hoverBg: 'rgba(255,255,255,.24)',
    hoverFg: '#FFFFFF',
    blur: true,
  },
  B: {
    mark: 'mono',
    bg: 'linear-gradient(100deg,#3448DC 0%,#7F7FD0 45%,#F3705E 100%)',
    fg: '#FFFFFF',
    muted: 'rgba(255,255,255,.85)',
    strong: '#FFFFFF',
    shadow: [['0 2px 8px', 'rgba(52,72,220,.25)']],
    hoverShadow: [['0 4px 14px', 'rgba(52,72,220,.35)']],
    hoverBg: 'linear-gradient(100deg,#3448DC 0%,#7F7FD0 45%,#F3705E 100%)',
    hoverFg: '#FFFFFF',
    blur: false,
  },
  MI: {
    mark: 'mono',
    bg: 'transparent',
    fg: '#1B1C24',
    muted: 'rgba(27,28,36,.6)',
    strong: '#1B1C24',
    shadow: [['inset 0 0 0 1px', 'rgba(27,28,36,.22)']],
    hoverShadow: [['inset 0 0 0 1px', 'rgba(27,28,36,.5)']],
    hoverBg: 'transparent',
    hoverFg: '#1B1C24',
    blur: false,
  },
  MP: {
    mark: 'mono',
    bg: 'transparent',
    fg: '#F1F1F4',
    muted: 'rgba(241,241,244,.62)',
    strong: '#F1F1F4',
    shadow: [['inset 0 0 0 1px', 'rgba(241,241,244,.24)']],
    hoverShadow: [['inset 0 0 0 1px', 'rgba(241,241,244,.5)']],
    hoverBg: 'transparent',
    hoverFg: '#F1F1F4',
    blur: false,
  },
  TO: {
    mark: 'none',
    bg: 'transparent',
    fg: '#55576A',
    muted: '#55576A',
    strong: '#1B1C24',
    shadow: [],
    hoverShadow: [],
    hoverBg: 'transparent',
    hoverFg: '#1B1C24',
    blur: false,
  },
  TOD: {
    mark: 'none',
    bg: 'transparent',
    fg: '#A0A2B0',
    muted: '#A0A2B0',
    strong: '#F1F1F4',
    shadow: [],
    hoverShadow: [],
    hoverBg: 'transparent',
    hoverFg: '#F1F1F4',
    blur: false,
  },
  MO: { mark: 'only', ...LIGHT_SIDE },
  MOD: { mark: 'only', ...DARK_SIDE },
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

/** The handoff's sizes. `ps` is the mark side (inline-start), `pe` the other. */
const SIZES = {
  s: { h: 22, fs: 11, mark: 9, gap: 5, ps: 7, pe: 9, dot: 28 },
  m: { h: 28, fs: 12, mark: 11, gap: 6, ps: 9, pe: 11, dot: 32 },
  l: { h: 34, fs: 13, mark: 13, gap: 7, ps: 11, pe: 14, dot: 38 },
} as const;

/** Text-only drops the mark, so it keeps a small even padding. */
const TEXT_ONLY_PADDING = 4;
const ROUNDED_RADIUS = '6px';
const PILL_RADIUS = '999px';

const BADGE_CLASS = 'hl-attribution';
const ROW_CLASS = 'hl-attribution-row';

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
  return {
    '--site-badge-h': `${only ? size.dot : size.h}px`,
    '--site-badge-fs': `${size.fs}px`,
    '--site-badge-mark': `${only ? size.mark + 1 : size.mark}px`,
    '--site-badge-gap': `${size.gap}px`,
    '--site-badge-ps': `${padStart}px`,
    '--site-badge-pe': `${padEnd}px`,
    '--site-badge-r': attribution.shape === 'rounded' && !only ? ROUNDED_RADIUS : PILL_RADIUS,
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

/**
 * The Hlou mark. The gradient's id comes from `useId`: unique per badge,
 * stable between the server render and a hydration, and allowed in a React
 * Server Component (`useId` is in React's server build) and in
 * `renderToStaticMarkup`. A fixed id would collide in the settings gallery
 * (a dozen badges on one page), and a `url(#id)` that resolves to a gradient
 * inside a hidden subtree paints nothing in some browsers.
 */
function HlouMark({ gradient }: { gradient: boolean }): ReactElement {
  const id = `hl-attribution-${useId().replace(/[^\w-]/g, '')}`;
  return (
    <svg viewBox={MARK_VIEW_BOX} aria-hidden="true" focusable="false">
      {gradient ? (
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            {MARK_STOPS.map(([offset, colour]) => (
              <stop key={offset} offset={offset} stopColor={colour} />
            ))}
          </linearGradient>
        </defs>
      ) : null}
      <path fill={gradient ? `url(#${id})` : 'currentColor'} fillRule="evenodd" d={MARK_PATH} />
    </svg>
  );
}

/**
 * The « Propulsé par Hlou » badge: one plain link, no client script — a
 * kernel page's islands never see it. The tone travels as custom properties
 * (`attributionBadgeVars`); `styles/site.css` holds the static rules. Render
 * it as an element (`<AttributionBadge />`), never by calling it: the mark
 * uses a hook. Nothing when the setting is off.
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
        <HlouMark gradient />
      ) : (
        <>
          {side.mark === 'color' || side.mark === 'mono' ? (
            <HlouMark gradient={side.mark === 'color'} />
          ) : null}
          <span className={`${BADGE_CLASS}__muted`}>{copy.poweredBy}</span>
          <span className={`${BADGE_CLASS}__strong`}>{copy.brand}</span>
        </>
      )}
    </a>
  );

  return placement === 'row' ? <div className={ROW_CLASS}>{badge}</div> : badge;
}
