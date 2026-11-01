/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema, floatingSlotSchema, longTextSchema } from '../../contracts';
import { styleProps } from '../style-props';

/** What a click on the canvas can pick inside a quote — each styleable. */
export const QUOTE_ELEMENTS = ['quote', 'by'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const quoteSchema = z.object({
  quote: boundSchema(longTextSchema),
  by: boundSchema(z.string()),
  align: z.enum(['start', 'center']),
  ...styleProps(QUOTE_ELEMENTS),
  /** Free elements drawn over the quote (`floating` blocks). */
  floating: floatingSlotSchema,
});
export type QuoteProps = z.infer<typeof quoteSchema>;
