/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { SiteAttribution, SiteAttributionTone, SiteColorScheme } from '../contracts';

import {
  DEFAULT_SITE_ATTRIBUTION,
  SITE_ATTRIBUTION_ALIGNS,
  SITE_ATTRIBUTION_EDGES,
  SITE_ATTRIBUTION_MAX_OFFSET,
  SITE_ATTRIBUTION_MODES,
  SITE_ATTRIBUTION_SHAPES,
  SITE_ATTRIBUTION_SIZES,
  SITE_ATTRIBUTION_TONES,
} from '../contracts';
import { hexToOklch, relativeLuminance } from '../theme/scheme';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** A site palette's three protected roles, one side (light or dark). */
export type AttributionPalette = { paper: string; ink: string; accent: string };

/** The Footer block's theme, which is the ground the badge sits on. */
export type AttributionFooterTheme = 'ink' | 'paper';

export type AttributionSuggestionInput = {
  light: AttributionPalette;
  dark: AttributionPalette;
  /** The scheme a version is pinned to; absent = follows the visitor. */
  colorScheme?: SiteColorScheme;
  /** The site footer's theme; absent = no footer, the badge sits on the paper. */
  footer?: AttributionFooterTheme | null;
};

/** Why a tone was suggested — an i18n key's last segment on the app side. */
export type AttributionReason =
  'monochrome' | 'footerInk' | 'footerPaper' | 'pinnedDark' | 'groundLight' | 'groundDark';

export type AttributionSuggestion = {
  tone: SiteAttributionTone;
  adaptive: boolean;
  reason: AttributionReason;
  /** `brand` when the accent sits near Hlou's own hues; otherwise empty. */
  alternatives: SiteAttributionTone[];
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** Above this relative luminance a ground counts as light (the light tones read on it). */
const LIGHT_GROUND_LUMINANCE = 0.4;
/** OKLCH chroma under which a palette counts as monochrome. */
const MONO_ACCENT_CHROMA = 0.03;
const MONO_PAPER_CHROMA = 0.02;
/** A saturated accent near Hlou's indigo or coral makes `brand` worth offering. */
const BRAND_MIN_CHROMA = 0.1;
const BRAND_HUES: ReadonlyArray<readonly [number, number]> = [
  [240, 290],
  [15, 45],
];

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pick<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
  return typeof value === 'string' && (options as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function offset(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value)
    ? Math.min(Math.max(value, 0), SITE_ATTRIBUTION_MAX_OFFSET)
    : fallback;
}

function hueDegrees(radians: number): number {
  return ((radians * 180) / Math.PI + 360) % 360;
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * A project's stored badge setting, whole: each field that is missing or no
 * longer valid falls back to the default on its own, so a stored
 * `{ enabled: false }` stays off and an old tone name never breaks a build.
 */
export function resolveAttribution(stored: unknown): SiteAttribution {
  const value = isRecord(stored) ? stored : {};
  const fallback = DEFAULT_SITE_ATTRIBUTION;
  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : fallback.enabled,
    tone: pick(SITE_ATTRIBUTION_TONES, value.tone, fallback.tone),
    adaptive: typeof value.adaptive === 'boolean' ? value.adaptive : fallback.adaptive,
    size: pick(SITE_ATTRIBUTION_SIZES, value.size, fallback.size),
    shape: pick(SITE_ATTRIBUTION_SHAPES, value.shape, fallback.shape),
    align: pick(SITE_ATTRIBUTION_ALIGNS, value.align, fallback.align),
    mode: pick(SITE_ATTRIBUTION_MODES, value.mode, fallback.mode),
    edge: pick(SITE_ATTRIBUTION_EDGES, value.edge, fallback.edge),
    offsetX: offset(value.offsetX, fallback.offsetX),
    offsetY: offset(value.offsetY, fallback.offsetY),
  };
}

/**
 * The tone to suggest for a site — deterministic, never applied on its own.
 * The first rule that holds wins:
 *
 * 1. a footer: the badge sits in its legal row (decision 193), so the
 *    footer is the ground — `ink` → `mono-paper`, `paper` → `mono-ink`;
 * 2. a monochrome palette (accent and paper nearly grey) → `mono-ink` on a
 *    light ground, `mono-paper` on a dark one;
 * 3. a version pinned dark → `dark`;
 * 4. otherwise the paper's luminance → `light` or `dark`.
 *
 * Every suggestion is adaptive: a footer's surface swaps with the scheme as
 * the mono tones do. Without a footer the ground is the paper of the side the
 * site shows first: dark when pinned dark, light otherwise.
 */
export function suggestAttribution(input: AttributionSuggestionInput): AttributionSuggestion {
  const side = input.colorScheme === 'dark' ? input.dark : input.light;
  const lightGround = relativeLuminance(side.paper) > LIGHT_GROUND_LUMINANCE;
  const accent = hexToOklch(side.accent);
  const paper = hexToOklch(side.paper);

  const accentHue = hueDegrees(accent.h);
  const nearHlou =
    accent.c > BRAND_MIN_CHROMA &&
    BRAND_HUES.some(([from, to]) => accentHue >= from && accentHue <= to);
  const alternatives: SiteAttributionTone[] = nearHlou ? ['brand'] : [];

  if (input.footer === 'ink') {
    return { tone: 'mono-paper', adaptive: true, reason: 'footerInk', alternatives };
  }
  if (input.footer === 'paper') {
    return { tone: 'mono-ink', adaptive: true, reason: 'footerPaper', alternatives };
  }
  if (accent.c < MONO_ACCENT_CHROMA && paper.c < MONO_PAPER_CHROMA) {
    return {
      tone: lightGround ? 'mono-ink' : 'mono-paper',
      adaptive: true,
      reason: 'monochrome',
      alternatives,
    };
  }
  if (input.colorScheme === 'dark') {
    return { tone: 'dark', adaptive: true, reason: 'pinnedDark', alternatives };
  }
  return lightGround
    ? { tone: 'light', adaptive: true, reason: 'groundLight', alternatives }
    : { tone: 'dark', adaptive: true, reason: 'groundDark', alternatives };
}
