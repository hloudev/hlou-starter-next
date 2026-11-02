/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema, resolvedMediaSchema } from '../../contracts';
import { itemStyleSchema, responsiveGapSchema, responsiveSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside a gallery — each styleable. */
export const GALLERY_ELEMENTS = ['title', 'items'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const galleryItemSchema = z.object({
  media: resolvedMediaSchema.nullable(),
  caption: boundSchema(z.string()),
  /** Followed only when the gallery's `onClick` is `link` (or unset). */
  href: z.string().describe('The link, used only when the gallery `onClick` is "link".'),
  /** In the grid layout: a tile two columns wide. */
  span: z.enum(['1', '2']),
  style: itemStyleSchema,
});
export type GalleryItem = z.infer<typeof galleryItemSchema>;

/**
 * Images, many: a portfolio, an exhibition, a venue. Four layouts —
 * a grid of fixed ratios, a masonry of natural heights, justified rows, a
 * horizontal strip — and a hover that zooms or reveals the caption.
 */
export const gallerySchema = z.object({
  title: boundSchema(z.string()),
  items: z.array(galleryItemSchema),
  layout: z.enum(['grid', 'masonry', 'justified', 'strip']),
  /** Columns per breakpoint, 1–6 (grid and masonry). */
  columns: responsiveSchema(z.number().int().min(1).max(6), 'columns'),
  gap: responsiveGapSchema,
  /** Tile ratio in the grid layout; the others keep each image's own. */
  ratio: z.enum(['auto', 'square', 'portrait', 'landscape', 'wide']),
  hover: z.enum(['none', 'zoom', 'caption']),
  /**
   * What a click on an image does: nothing, follow the item's
   * `href`, or open the lightbox. Unset reads as `link` — stored galleries
   * do not change.
   */
  onClick: z
    .enum(['none', 'link', 'lightbox'])
    .optional()
    .describe(
      'none, link (the item href; the default for stored galleries) or lightbox (a full-screen viewer over the first 60 images).'
    ),
  ...styleProps(GALLERY_ELEMENTS),
});
export type GalleryProps = z.infer<typeof gallerySchema>;
