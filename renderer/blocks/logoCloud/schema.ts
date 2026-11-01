/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema, resolvedMediaSchema } from '../../contracts';
import { itemStyleSchema, responsiveSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside a logo cloud — each styleable. */
export const LOGO_CLOUD_ELEMENTS = ['title', 'items'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const logoItemSchema = z.object({
  media: resolvedMediaSchema.nullable(),
  href: z.string(),
  alt: boundSchema(z.string()),
  style: itemStyleSchema,
});

/** Clients, partners, press (M29): a row of logos at one height. */
export const logoCloudSchema = z.object({
  title: boundSchema(z.string()),
  items: z.array(logoItemSchema),
  columns: responsiveSchema(z.number().int().min(2).max(6), 'columns'),
  grayscale: z.boolean(),
  size: z.enum(['sm', 'md', 'lg']),
  ...styleProps(LOGO_CLOUD_ELEMENTS),
});
export type LogoCloudProps = z.infer<typeof logoCloudSchema>;
