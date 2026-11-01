/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import {
  boundMediaSchema,
  boundSchema,
  floatingSlotSchema,
  richTextDocSchema,
} from '../../contracts';
import { buttonItemSchema } from '../buttons/schema';
import { responsiveAspectSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside a media + text section — each styleable. */
export const MEDIA_TEXT_ELEMENTS = ['eyebrow', 'title', 'text', 'buttons', 'media'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/**
 * The split section (M29): an image on one side, copy on the other — the
 * shape most brand pages repeat after the hero. The split and the media side
 * are props; the ratio is responsive.
 */
export const mediaTextSchema = z.object({
  media: boundMediaSchema().nullable(),
  mediaSide: z.enum(['start', 'end']),
  mediaRatio: responsiveAspectSchema,
  /** Column widths, media first: equal, media narrow, media wide. */
  split: z.enum(['1-1', '1-2', '2-1']),
  verticalAlign: z.enum(['start', 'center', 'end']),
  eyebrow: boundSchema(z.string()),
  title: boundSchema(z.string()),
  text: boundSchema(richTextDocSchema),
  buttons: z.array(buttonItemSchema),
  ...styleProps(MEDIA_TEXT_ELEMENTS),
  /** Free elements drawn over the section (`floating` blocks). */
  floating: floatingSlotSchema,
});
export type MediaTextProps = z.infer<typeof mediaTextSchema>;
