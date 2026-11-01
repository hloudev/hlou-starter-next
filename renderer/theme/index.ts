import type { SiteThemeDensity, SiteThemeFontRole, SiteThemeTokens } from '../contracts';
import { resolveFontsForLocale } from './fonts';
import { fontCategory } from './google-fonts-catalog';
import { resolveDarkColors } from './scheme';

import { DEFAULT_THEME_TOKENS, siteThemeTokensSchema } from '../contracts';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/**
 * `--site-color-<role.key>` / `--site-font-<role.key>` for every role, plus
 * the fixed layout/type-scale variables — an open record, not a closed
 * union, since a project's roles are no longer a fixed set.
 */
export type SiteCssVariables = Record<string, string>;
/** @deprecated kept for import compatibility; equivalent to `keyof SiteCssVariables` being open now. */
export type SiteCssVariable = string;

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** The boundary class. Nothing inside it may read `--hl-*` or `--mantine-*`. */
export const SITE_SCOPE_CLASS = 'hl-site-scope';

/** On the `<html>` of a page that carries the theme itself (`/s`, `/p`, the
 *  starter): gives it the scope's `color-scheme` rules, so the page behind
 *  the scope switches palette with it. */
export const SITE_ROOT_CLASS = 'hl-site-root';

/** Section padding (block / inline) per density, from the design README §11. */
const DENSITY_PADDING: Record<SiteThemeDensity, { y: number; x: number }> = {
  tight: { y: 34, x: 26 },
  base: { y: 54, x: 40 },
  roomy: { y: 74, x: 56 },
};

const GENERIC_FALLBACK: Record<string, string> = {
  serif: 'Georgia, serif',
  'sans-serif': 'Inter, sans-serif',
  display: 'Georgia, serif',
  monospace: 'ui-monospace, monospace',
  handwriting: 'cursive',
};

export { DEFAULT_THEME_TOKENS };

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * A font role's face as a CSS value: the family, host-overridable through a
 * `--font-<slug>` variable the same way `next/font` used to (so a consumer
 * that self-hosts the family still wins with no `!important`), falling back
 * to the literal family name and its category's generic stack.
 */
function fontStack(role: SiteThemeFontRole): string {
  const generic = GENERIC_FALLBACK[fontCategory(role.family)] ?? GENERIC_FALLBACK['sans-serif'];
  const slug = role.family.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `var(--font-${slug}, '${role.family}'), ${generic}`;
}

/** A colour for both schemes — `light-dark()`, or the bare value when the two agree. */
function schemePair(light: string, dark: string | undefined): string {
  return !dark || dark.toLowerCase() === light.toLowerCase()
    ? light
    : `light-dark(${light}, ${dark})`;
}

/** A role removed from `DEFAULT_THEME_TOKENS` would be a contract bug, not a possible runtime state. */
function defaultColor(key: string): string {
  for (const role of DEFAULT_THEME_TOKENS.colors) if (role.key === key) return role.value;
  return '#000000';
}
function defaultFont(key: string): SiteThemeFontRole {
  for (const role of DEFAULT_THEME_TOKENS.fonts) if (role.key === key) return role;
  return { key, source: 'google', family: 'Inter' };
}

/**
 * The project's theme tokens as the custom properties `site.css` reads. Applied
 * as an inline style on the `.hl-site-scope` wrapper, so the same stylesheet
 * paints every project and a theme change is a style attribute, not a build.
 *
 * Partial or invalid input falls back field by field to the defaults — the
 * canvas must never go blank because a tenant saved an odd token. Emits one
 * `--site-color-<key>` / `--site-font-<key>` per role (open-ended, for a
 * block/item's `colorPropSchema`/`fontPropSchema` overrides — `shared.tsx`'s
 * `resolveColorValue`/`resolveFontValue`), PLUS the legacy `--site-accent`/
 * `--site-paper`/`--site-ink`/`--site-heading-font` names every existing
 * `site.css` rule already reads, aliased to the role of the same key.
 *
 * `locale` resolves each font role's `localeOverrides` first (see
 * `resolveFontsForLocale`) — omitted, every caller from before this theme
 * supported locale overrides behaves exactly as before (no override ever
 * applies).
 */
export function themeToCss(tokens: unknown, locale?: string): SiteCssVariables {
  const parsed = siteThemeTokensSchema.safeParse(tokens ?? {});
  const theme: SiteThemeTokens = parsed.success ? parsed.data : DEFAULT_THEME_TOKENS;
  const padding = DENSITY_PADDING[theme.density];
  const fonts = locale ? resolveFontsForLocale(theme.fonts, locale) : theme.fonts;

  /* Every colour is a `light-dark()` pair; `color-scheme` on the scope (or on
     `<html>` in a published site — see `site.css`) picks the side, so one
     inline style carries both palettes and switching scheme is an attribute,
     not a re-render. */
  const darkColors = resolveDarkColors(theme.colors);
  const findColor = (key: string) => {
    const role = theme.colors.find((candidate) => candidate.key === key);
    return role
      ? schemePair(role.value, darkColors[key] ?? role.value)
      : schemePair(defaultColor(key), resolveDarkColors(DEFAULT_THEME_TOKENS.colors)[key]);
  };
  const accent = findColor('accent');
  const paper = findColor('paper');
  const ink = findColor('ink');
  const heading = fonts.find((role) => role.key === 'heading') ?? defaultFont('heading');
  const body = fonts.find((role) => role.key === 'body') ?? defaultFont('body');

  /* Legacy names first (same order as before this theme became role arrays,
     so a byte-diff on an unrelated change stays small), then one generic
     `--site-color-<key>`/`--site-font-<key>` per role for `shared.tsx`'s
     `resolveColorValue`/`resolveFontValue`. `--site-body-font` was never
     emitted before the theme had a `body` role at all (`site.css`'s own
     `.hl-site-scope` base rule set it to a hardcoded system-font stack) —
     it IS a role now, so it belongs alongside `--site-heading-font`. */
  const vars: SiteCssVariables = {
    '--site-accent': accent,
    '--site-accent-soft': `color-mix(in srgb, ${accent} 15%, transparent)`,
    '--site-paper': paper,
    '--site-ink': ink,
    '--site-ink-soft': `color-mix(in srgb, ${ink} 66%, ${paper})`,
    '--site-heading-font': fontStack(heading),
    '--site-body-font': fontStack(body),
    '--site-radius': `${theme.radius}px`,
    '--site-pad-y': `${padding.y}px`,
    '--site-pad-x': `${padding.x}px`,
    '--site-type-xs': `${theme.typeScale.xs}px`,
    '--site-type-sm': `${theme.typeScale.sm}px`,
    '--site-type-md': `${theme.typeScale.md}px`,
    '--site-type-lg': `${theme.typeScale.lg}px`,
    '--site-type-xl': `${theme.typeScale.xl}px`,
  };

  for (const role of theme.colors) {
    vars[`--site-color-${role.key}`] = schemePair(role.value, darkColors[role.key] ?? role.value);
  }
  for (const role of fonts) {
    vars[`--site-font-${role.key}`] = fontStack(role);
    /* Only what the level sets: an absent one leaves each element as its
       block draws it (`levelStyle` in `blocks/shared.tsx` reads the same set). */
    if (role.weight !== undefined) vars[`--site-font-${role.key}-weight`] = String(role.weight);
    if (role.size !== undefined) vars[`--site-font-${role.key}-size`] = `${role.size}px`;
    if (role.lineHeight !== undefined) {
      vars[`--site-font-${role.key}-leading`] = String(role.lineHeight);
    }
    if (role.letterSpacing !== undefined) {
      vars[`--site-font-${role.key}-tracking`] = `${role.letterSpacing}em`;
    }
  }

  return vars;
}

/** The roles `site.css` reads by their legacy names too (`--site-paper` …). */
const LEGACY_COLOR_KEYS = new Set(['accent', 'paper', 'ink']);

/**
 * One rule per colour scheme (M33-13): a section carrying
 * `data-hl-scheme="<key>"` re-points the colour roles the scheme names, both
 * palettes at once, for everything inside it. A role the scheme leaves out
 * keeps the theme's light value, and every dark side is derived again over
 * the scheme's colours (decision 52, per scheme) — a lighter paper gets its
 * own dark paper, and the accent is lifted against THAT. `site.css` derives
 * the soft, hairline, card and on-colour tokens from these on the same
 * element, and paints the section's surface.
 *
 * Every value is schema-checked (hex colours, role and scheme keys), so the
 * CSS cannot carry anything but declarations. Empty when the theme has none.
 */
export function schemesCss(tokens: unknown): string {
  const parsed = siteThemeTokensSchema.safeParse(tokens ?? {});
  if (!parsed.success) return '';
  const theme = parsed.data;
  const rules: string[] = [];
  for (const scheme of theme.schemes ?? []) {
    const colors = theme.colors.map((role) => {
      const own = scheme.roles[role.key];
      return own ? { key: role.key, value: own.value, dark: own.dark } : role;
    });
    const darkColors = resolveDarkColors(colors);
    const declarations: string[] = [];
    for (const role of colors) {
      const pair = schemePair(role.value, darkColors[role.key] ?? role.value);
      declarations.push(`--site-color-${role.key}: ${pair};`);
      if (LEGACY_COLOR_KEYS.has(role.key)) declarations.push(`--site-${role.key}: ${pair};`);
    }
    rules.push(
      `.${SITE_SCOPE_CLASS} [data-hl-scheme="${scheme.key}"] { ${declarations.join(' ')} }`
    );
  }
  return rules.join('\n');
}
