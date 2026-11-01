/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { ResolvedCollection } from '../../contracts';

import { boundSchema, collectionSourceSchema, resolvedMediaSchema } from '../../contracts';
import { listingMappingSchema } from '../listings/schema';
import { itemStyleSchema, responsiveGapSchema, responsiveSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside a carousel — each styleable. */
export const CAROUSEL_ELEMENTS = ['title', 'items', 'arrows', 'dots'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/**
 * One slide: an image and a few lines. Typed items, not a slot per slide
 * (M40-08): a slot would make each slide a nested document and still not
 * say « one card per record ».
 */
export const carouselSlideSchema = z.object({
  media: resolvedMediaSchema.nullable(),
  eyebrow: boundSchema(z.string()),
  title: boundSchema(z.string()),
  text: boundSchema(z.string()),
  href: z.string(),
  ctaLabel: boundSchema(z.string()),
  style: itemStyleSchema,
});
export type CarouselSlide = z.infer<typeof carouselSlideSchema>;

/**
 * A row of slides the visitor steps through (M40-08, decision 199): the
 * browser's own scroll-snap track, which an island arms with arrows, dots,
 * the keyboard, a mouse drag and an optional autoplay. Its slides are typed
 * items, or a collection's records through the listings mapping.
 */
export const carouselSchema = z.object({
  title: boundSchema(z.string()),
  items: z.array(carouselSlideSchema).max(24),
  /** A collection's records become the slides; `items` is then ignored. */
  source: collectionSourceSchema.nullable(),
  mapping: listingMappingSchema,
  limit: z.number().int().min(3).max(24),
  /** `card`: the lines under the image · `textOver`: over it · `image`: the image alone. */
  look: z.enum(['card', 'textOver', 'image']),
  /** Whole slides in view per breakpoint, 1–4 (a peek adds part of the next). */
  perView: responsiveSchema(z.number().int().min(1).max(4), 'columns'),
  align: z.enum(['start', 'center']),
  /** Show part of the neighbouring slides. */
  peek: z.boolean(),
  ratio: z.enum(['square', 'portrait', 'landscape', 'wide']),
  gap: responsiveGapSchema,
  arrows: z.enum(['none', 'sides', 'below']),
  dots: z.boolean(),
  /** Seconds between slides, 0 = off. Never under reduced motion; pauses on hover and focus. */
  autoplay: z.number().int().min(0).max(15),
  /** The last slide's « next » rewinds to the first (no endless clone). */
  loop: z
    .boolean()
    .describe('Rewind to the first slide after the last one (not an infinite loop).'),
  /** What a click on a slide's image does (M40-09): follow its `href`, or open the lightbox. */
  onClick: z
    .enum(['none', 'link', 'lightbox'])
    .optional()
    .describe('link (the slide href, the default), none, or lightbox (a full-screen viewer).'),
  ...styleProps(CAROUSEL_ELEMENTS),
});
export type CarouselStoredProps = z.infer<typeof carouselSchema>;
export type CarouselProps = Omit<CarouselStoredProps, 'source'> & {
  source: CarouselStoredProps['source'] | ResolvedCollection;
};
