import type { SiteThemeFontRole } from '../contracts';

import { isFontFamilyName } from '../contracts';

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Each role, substituting its `localeOverrides[locale]` face when one is set
 * — the one place a render pass (which always renders exactly one locale at
 * a time, see `SiteRenderContext`) turns "a role might vary by locale" into
 * "here is the flat font list for THIS page". `themeToCss` and `SiteRoot`'s
 * `googleFontsHref`/`fontFaceCss` calls both resolve through this, so a page
 * only ever requests its own locale's font, never every locale's at once.
 */
export function resolveFontsForLocale(
  fonts: readonly SiteThemeFontRole[],
  locale: string
): SiteThemeFontRole[] {
  return fonts.map((role) => {
    const override = role.localeOverrides?.[locale];
    if (!override) return role;
    /* The locale swaps the face; the level's weight, size and spacing stay. */
    const { weight, size, lineHeight, letterSpacing } = role;
    return {
      key: role.key,
      label: role.label,
      weight,
      size,
      lineHeight,
      letterSpacing,
      ...override,
    };
  });
}

/**
 * One combined Google Fonts stylesheet URL for every `source: 'google'` role,
 * the same endpoint the two hardcoded families load from today — needs no
 * API key. `null` when the theme has no Google-sourced font (nothing to
 * load). Pure: no DB, no fetch, so this package stays import-nothing.
 */
export function googleFontsHref(fonts: readonly SiteThemeFontRole[]): string | null {
  const families = fonts.filter((font) => font.source === 'google');
  if (families.length === 0) return null;
  const params = families
    .map((font) => {
      const weights = font.weights && font.weights.length > 0 ? font.weights : [400, 500, 700];
      /* The level's own weight too, or a 300/800 level renders a synthesised face. */
      const axis = [...new Set(font.weight ? [...weights, font.weight] : weights)]
        .sort((a, b) => a - b)
        .join(';');
      return `family=${encodeURIComponent(font.family).replace(/%20/g, '+')}:wght@${axis}`;
    })
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/**
 * `@font-face` rules for every `source: 'custom'` role, resolving each
 * role's uploaded asset through `resolveAssetUrl` (externalised the same way
 * `withResolvedMediaUrls` externalises media URLs — this package owns no
 * storage/DB access). Empty string when there is nothing to upload yet, or
 * `resolveAssetUrl` can't resolve a role (its asset was removed).
 */
export function fontFaceCss(
  fonts: readonly SiteThemeFontRole[],
  resolveAssetUrl: (assetId: string) => string | null
): string {
  const rules: string[] = [];
  for (const font of fonts) {
    if (font.source !== 'custom' || !font.assetId) continue;
    const url = resolveAssetUrl(font.assetId);
    /* This string is a <style> BODY: a quote in either value closes the CSS
       string and everything after it is a rule for the whole document. The
       family is re-checked here (a snapshot outlives the contract it was
       written under), and the URL is ours — same-origin or https — with the
       characters that could end `url('…')` percent-encoded. */
    if (!url || !isFontFamilyName(font.family) || !/^(?:\/(?!\/)|https:\/\/)/.test(url)) continue;
    /* Not `encodeURIComponent`: it leaves `'`, `(` and `)` as they are. */
    const safeUrl = url.replace(
      /['"\\()\s<>]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`
    );
    rules.push(
      `@font-face { font-family: '${font.family}'; src: url('${safeUrl}'); font-display: swap; }`
    );
  }
  return rules.join('\n');
}
