/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { CarouselStoredProps } from './schema';

import { densityOption, responsiveColumnsOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/**
 * Slides to step through. Three carousels a design asked for: cards
 * with the text over the photo, a centred row whose neighbours peek, and one
 * full-width photo at a time.
 */
export const carouselDesign: BlockDesign<CarouselStoredProps> = {
  role: 'gallery',
  variants: [
    {
      key: 'cards',
      labelKey: 'Design.variants.carousel.cards',
      thumbnail: 'carousel',
      props: {
        look: 'textOver',
        perView: { base: 1, md: 2, lg: 3 },
        align: 'start',
        peek: true,
        arrows: 'below',
      },
    },
    {
      key: 'centered',
      labelKey: 'Design.variants.carousel.centered',
      thumbnail: 'gallery-strip',
      props: {
        look: 'image',
        perView: { base: 1, md: 2 },
        align: 'center',
        peek: true,
        arrows: 'sides',
        dots: true,
      },
    },
    {
      key: 'full',
      labelKey: 'Design.variants.carousel.full',
      thumbnail: 'hero-full',
      props: {
        look: 'image',
        perView: { base: 1 },
        align: 'start',
        peek: false,
        ratio: 'wide',
        arrows: 'sides',
        dots: true,
      },
    },
  ],
  designOptions: [
    densityOption<CarouselStoredProps>(),
    responsiveColumnsOption<CarouselStoredProps, 'perView'>('perView', [1, 2, 3, 4]),
  ],
};
