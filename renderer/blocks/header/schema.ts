/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundMediaSchema, boundSchema } from '../../contracts';
import { itemStyleSchema, styleProps } from '../style-props';

/**
 * What a click on the canvas can pick inside a header — each styleable. The
 * menu panel and the burger are picked in the header's component
 * frame, which previews the panel under the bar.
 */
export const HEADER_ELEMENTS = ['logo', 'links', 'ctaLabel', 'menu', 'burger'] as const;

/** At most this many children under one link: one level, no mega menu. */
export const NAV_CHILDREN_MAX = 8;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const navChildSchema = z.object({ label: z.string(), href: z.string() });
export type NavChild = z.infer<typeof navChildSchema>;

export const navLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  style: itemStyleSchema,
  /** A dropdown under the link; with an empty `href` the label only opens it. */
  children: z.array(navChildSchema).max(NAV_CHILDREN_MAX).optional(),
});
export type NavLink = z.infer<typeof navLinkSchema>;

export const headerSchema = z.object({
  /** The wordmark — and the image's alt when `logoMedia` is set. */
  logo: boundSchema(z.string()),
  /**
   * The logo as an image: an SVG or PNG from the library, drawn at
   * `logoHeight` — or bound to a media slot (`site.logoImage`, per locale).
   */
  logoMedia: boundMediaSchema().nullable().optional(),
  logoHeight: z.number().int().min(16).max(120).optional(),
  links: boundSchema(z.array(navLinkSchema)),
  ctaLabel: boundSchema(z.string()),
  ctaHref: z.string(),
  sticky: z.boolean(),
  /**
   * The menu: the links in the bar (`inline`, also when absent — a
   * stored header renders as it did), a sheet from the inline end below
   * `menuBreakpoint` (`drawer`), or a full-screen menu behind a burger at
   * every width (`fullscreen`). Native popovers: no script to open or close.
   */
  menuStyle: z.enum(['inline', 'drawer', 'fullscreen']).optional(),
  /** `drawer`: the bar's links from this width up, the burger below it. Absent = `lg`. */
  menuBreakpoint: z.enum(['md', 'lg']).optional(),
  /** `fullscreen`: the photo on the menu's start half (a dimmed background on a phone). */
  menuMedia: boundMediaSchema().nullable().optional(),
  /**
   * Transparent over the block below it, on-ink text — set per page
   * through the instance's override (Home over its overlay hero). With
   * `sticky` it takes the paper once the page scrolls.
   */
  overlay: z.boolean().optional(),
  ...styleProps(HEADER_ELEMENTS),
});
export type HeaderProps = z.infer<typeof headerSchema>;
