/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import {
  boundSchema,
  floatingSlotSchema,
  longTextSchema,
  resolvedMediaSchema,
  richTextDocSchema,
} from '../../contracts';
import { buttonItemSchema } from '../buttons/schema';
import { iconSchema, itemStyleSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside a custom section — each styleable. */
export const CUSTOM_ELEMENTS = ['eyebrow', 'title', 'text', 'items', 'media', 'buttons'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const customItemSchema = z.object({
  title: boundSchema(z.string()),
  text: boundSchema(longTextSchema),
  media: resolvedMediaSchema.nullable(),
  icon: iconSchema,
  href: z.string(),
  label: boundSchema(z.string()),
  style: itemStyleSchema,
});
export type CustomItem = z.infer<typeof customItemSchema>;

/**
 * A section no block has: neutral content props — an
 * eyebrow, a title, a text, items, media, buttons, free data — that a
 * hand-written `Component.tsx` variant draws its own way (Design › Code,
 * or the agent's `write_block_code`). Hlou's own render is a plain stacked
 * list, so the content is never lost; the variant is the design.
 */
export const customSchema = z.object({
  eyebrow: boundSchema(z.string()),
  title: boundSchema(z.string()),
  text: boundSchema(richTextDocSchema),
  items: z.array(customItemSchema),
  media: z.array(
    z.object({ media: resolvedMediaSchema.nullable(), caption: boundSchema(z.string()) })
  ),
  buttons: z.array(buttonItemSchema),
  /** Anything else the variant needs: plain JSON. */
  data: z.record(z.string(), z.unknown()),
  ...styleProps(CUSTOM_ELEMENTS),
  /** Free elements drawn over the section (`floating` blocks). */
  floating: floatingSlotSchema,
});
export type CustomProps = z.infer<typeof customSchema>;
