/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema, slotContentSchema } from '../../contracts';
import { styleProps } from '../style-props';

/** What a click on the canvas can pick inside the modal — each styleable. */
export const MODAL_ELEMENTS = ['title', 'panel'] as const;

/** The key a trigger names: `href="#modal-<key>"`. */
export const MODAL_KEY_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/**
 * A window over the page (M40-10), holding other blocks. There is no
 * « opens » prop anywhere: any link whose href is `#modal-<key>` opens it —
 * a button, a hero button, the header CTA, a text link — on this page, and
 * from another page through the URL's hash. Without a script the link is an
 * anchor, and the window shows as a `:target`.
 */
export const modalSchema = z.object({
  key: z.string().regex(MODAL_KEY_PATTERN),
  title: boundSchema(z.string()),
  hideTitle: z.boolean(),
  size: z.enum(['sm', 'md', 'lg', 'full']),
  content: slotContentSchema,
  ...styleProps(MODAL_ELEMENTS),
});
export type ModalProps = z.infer<typeof modalSchema>;
