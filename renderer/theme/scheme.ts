import type { SiteThemeColorRole } from '../contracts';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type Oklch = { l: number; c: number; h: number };
type Rgb = { r: number; g: number; b: number };

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** Where a derived dark paper / ink land in OKLCH lightness. */
const DARK_PAPER_L = 0.2;
const DARK_INK_L = 0.93;
/** Near-neutral surfaces stay near-neutral in dark: chroma is capped, hue kept. */
const SURFACE_MAX_CHROMA = 0.02;
/** WCAG AA for body text — what a derived accent must hold on the dark paper. */
const ACCENT_MIN_CONTRAST = 4.5;

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function hexToRgb(hex: string): Rgb {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? [...raw].map((digit) => digit + digit).join('') : raw;
  const value = Number.parseInt(full, 16);
  return { r: ((value >> 16) & 255) / 255, g: ((value >> 8) & 255) / 255, b: (value & 255) / 255 };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const channel = (value: number) =>
    Math.round(Math.min(1, Math.max(0, value)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

const toLinear = (value: number) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const toGamma = (value: number) =>
  value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;

/** sRGB → OKLCH (Björn Ottosson's OKLab matrices). */
function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: Math.atan2(B, A) };
}

/** OKLCH → linear sRGB, unclamped (a channel outside 0–1 means out of gamut). */
function oklchToLinear({ l: L, c, h }: Oklch): Rgb {
  const A = c * Math.cos(h);
  const B = c * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

/** Back to hex, shedding chroma (never lightness or hue) until it fits sRGB. */
function oklchToHex(colour: Oklch): string {
  let chroma = colour.c;
  let linear = oklchToLinear(colour);
  const inGamut = ({ r, g, b }: Rgb) =>
    [r, g, b].every((value) => value >= -0.0001 && value <= 1.0001);
  while (!inGamut(linear) && chroma > 0.001) {
    chroma *= 0.95;
    linear = oklchToLinear({ ...colour, c: chroma });
  }
  return rgbToHex({ r: toGamma(linear.r), g: toGamma(linear.g), b: toGamma(linear.b) });
}

/** WCAG 2 relative luminance of a hex colour (0–1). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** A hex colour in OKLCH; `h` in radians. */
export function hexToOklch(hex: string): Oklch {
  return rgbToOklch(hexToRgb(hex));
}

/** WCAG 2 contrast ratio between two hex colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

function deriveSurface(hex: string, targetL: number, flip: (l: number) => boolean): string {
  const colour = rgbToOklch(hexToRgb(hex));
  if (!flip(colour.l)) return hex;
  return oklchToHex({ l: targetL, c: Math.min(colour.c, SURFACE_MAX_CHROMA), h: colour.h });
}

function deriveAccent(hex: string, darkPaper: string): string {
  const colour = rgbToOklch(hexToRgb(hex));
  let l = Math.max(colour.l, 0.62);
  let candidate = oklchToHex({ ...colour, l });
  while (contrastRatio(candidate, darkPaper) < ACCENT_MIN_CONTRAST && l < 0.95) {
    l += 0.02;
    candidate = oklchToHex({ ...colour, l });
  }
  return candidate;
}

/** A free role: mirror it across the lightness axis when it sits near an
 *  extreme (a near-white surface or a near-black text colour), otherwise
 *  lift it a little so it still reads on a dark paper. */
function deriveOther(hex: string): string {
  const colour = rgbToOklch(hexToRgb(hex));
  if (colour.l > 0.8 || colour.l < 0.3) {
    return oklchToHex({ ...colour, l: Math.min(0.95, Math.max(0.15, 1.05 - colour.l)) });
  }
  return oklchToHex({ ...colour, l: Math.min(0.9, colour.l + 0.08) });
}

/**
 * Every colour role's dark-scheme value, keyed by role: the role's own `dark`
 * when authored, otherwise one DERIVED from its light `value` — `paper` and
 * `ink` trade places in lightness (hue kept, chroma damped), `accent` keeps
 * its hue and is lifted until it holds AA contrast on the derived paper, and
 * any other role is mirrored or lifted by `deriveOther`.
 *
 * Pure and deterministic: `themeToCss` writes its result into the
 * `light-dark()` pairs, and the Theme panel shows it as the value an
 * unauthored role will render with.
 */
export function resolveDarkColors(colors: SiteThemeColorRole[]): Record<string, string> {
  const find = (key: string) => colors.find((role) => role.key === key);
  const paperRole = find('paper');
  const darkPaper =
    paperRole?.dark ??
    (paperRole ? deriveSurface(paperRole.value, DARK_PAPER_L, (l) => l >= 0.5) : '#1c1a17');

  const resolved: Record<string, string> = {};
  for (const role of colors) {
    if (role.dark) {
      resolved[role.key] = role.dark;
    } else if (role.key === 'paper') {
      resolved[role.key] = darkPaper;
    } else if (role.key === 'ink') {
      resolved[role.key] = deriveSurface(role.value, DARK_INK_L, (l) => l < 0.5);
    } else if (role.key === 'accent') {
      resolved[role.key] = deriveAccent(role.value, darkPaper);
    } else {
      resolved[role.key] = deriveOther(role.value);
    }
  }
  return resolved;
}

/* -------------------------------------------------------------------------- */
/*                               SCHEME SELECTION                             */
/* -------------------------------------------------------------------------- */

/** On `.hl-site-scope` or `<html>`: forces one palette (`site.css`). Absent,
 *  the site follows the visitor's system through `color-scheme: light dark`. */
export const SITE_SCHEME_ATTRIBUTE = 'data-site-scheme';

/** Where the theme-toggle block remembers a visitor's choice. */
export const SITE_SCHEME_STORAGE_KEY = 'hl-site-scheme';

/**
 * An inline `<head>` script for a published page: re-applies a visitor's
 * remembered choice before first paint, so a reload in the non-system scheme
 * doesn't flash. Guarded — storage can throw in a private window, and a bad
 * value is ignored rather than trusted into the attribute.
 */
export const SITE_SCHEME_SCRIPT = `try{var s=localStorage.getItem('${SITE_SCHEME_STORAGE_KEY}');if(s==='light'||s==='dark')document.documentElement.setAttribute('${SITE_SCHEME_ATTRIBUTE}',s)}catch(e){}`;
