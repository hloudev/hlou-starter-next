/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema, floatingSlotSchema, longTextSchema } from '../../contracts';
import { styleProps } from '../style-props';

/** What a click on the canvas can pick inside a CTA band — each styleable. */
export const CTA_BAND_ELEMENTS = ['title', 'description', 'buttonLabel'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const ctaBandSchema = z.object({
  title: boundSchema(z.string()),
  description: boundSchema(longTextSchema),
  buttonLabel: boundSchema(z.string()),
  buttonHref: z.string(),
  background: z.enum(['accent', 'ink', 'paper']),
  ...styleProps(CTA_BAND_ELEMENTS),
  /** Free elements drawn over the band (`floating` blocks). */
  floating: floatingSlotSchema,
});
export type CtaBandProps = z.infer<typeof ctaBandSchema>;
