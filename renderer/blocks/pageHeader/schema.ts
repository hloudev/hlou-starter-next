/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema, floatingSlotSchema } from '../../contracts';
import { styleProps } from '../style-props';

/** What a click on the canvas can pick inside a page header — each styleable. */
export const PAGE_HEADER_ELEMENTS = ['eyebrow', 'title'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const pageHeaderSchema = z.object({
  eyebrow: boundSchema(z.string()),
  title: boundSchema(z.string()),
  ...styleProps(PAGE_HEADER_ELEMENTS),
  /** Free elements drawn over the page header (`floating` blocks). */
  floating: floatingSlotSchema,
});
export type PageHeaderProps = z.infer<typeof pageHeaderSchema>;
