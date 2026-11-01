/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema, richTextDocSchema } from '../../contracts';
import { itemStyleSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside an accordion — each styleable. */
export const ACCORDION_ELEMENTS = ['title', 'items'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const accordionItemSchema = z.object({
  title: boundSchema(z.string()),
  body: boundSchema(richTextDocSchema),
  /** Open when the page loads. */
  open: z.boolean(),
  style: itemStyleSchema,
});
export type AccordionItem = z.infer<typeof accordionItemSchema>;

/**
 * Questions and answers, specs, steps (M29): native `<details>`, so it
 * works without a script and hydrates nothing. One open at a time unless
 * `allowMultiple`.
 */
export const accordionSchema = z.object({
  title: boundSchema(z.string()),
  items: z.array(accordionItemSchema),
  allowMultiple: z.boolean(),
  icon: z.enum(['caret', 'plus']),
  divided: z.boolean(),
  width: z.enum(['narrow', 'wide']),
  ...styleProps(ACCORDION_ELEMENTS),
});
export type AccordionProps = z.infer<typeof accordionSchema>;
