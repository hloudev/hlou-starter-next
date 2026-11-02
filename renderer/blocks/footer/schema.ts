/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundMediaSchema, boundSchema } from '../../contracts';
import { navLinkSchema } from '../header/schema';
import { iconSchema, itemStyleSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside a footer — each styleable. */
export const FOOTER_ELEMENTS = ['brand', 'groups', 'legal', 'social'] as const;

export const socialLinkSchema = z.object({
  icon: iconSchema,
  href: z.string(),
  /** The link's accessible name: copy, so it binds like any other. */
  label: boundSchema(z.string()),
});

/**
 * A footer link: a header link whose label binds on its own. A header's
 * links bind as ONE navigation slot (the menu, per locale); a footer's
 * groups are not a menu, so each label is its own copy.
 */
export const footerLinkSchema = navLinkSchema.extend({ label: boundSchema(z.string()) });

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const footerGroupSchema = z.object({
  heading: boundSchema(z.string()),
  items: z.array(footerLinkSchema),
  style: itemStyleSchema,
});

export const footerSchema = z.object({
  /** A brand column before the link groups: wordmark or logo, a line, social links. */
  logo: z.string().optional(),
  /** An image, or bound to a media slot (`site.logoImage`). */
  logoMedia: boundMediaSchema().nullable().optional(),
  tagline: boundSchema(z.string()).optional(),
  social: z.array(socialLinkSchema).optional(),
  groups: z.array(footerGroupSchema),
  legal: boundSchema(z.string()),
  theme: z.enum(['ink', 'paper']),
  ...styleProps(FOOTER_ELEMENTS),
});
export type FooterProps = z.infer<typeof footerSchema>;
