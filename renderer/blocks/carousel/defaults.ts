/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CarouselSlide, CarouselStoredProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

const slide = (eyebrow: string, title: string, text: string): CarouselSlide => ({
  media: null,
  eyebrow,
  title,
  text,
  href: '',
  ctaLabel: '',
});

export const carouselDefaults: CarouselStoredProps = {
  title: 'Nos séjours',
  items: [
    slide('Deux nuits', 'La tente des dunes', 'Au pied de l’erg, face au couchant.'),
    slide('Une nuit', 'Le salon berbère', 'Thé, tapis et lanternes.'),
    slide('Trois nuits', 'La terrasse', 'Le petit-déjeuner au soleil levant.'),
    slide('Le soir', 'La table d’hôtes', 'Cuisine du sud, au feu de bois.'),
  ],
  source: null,
  mapping: {
    titleField: 'title',
    imageField: 'image',
    metaField: 'meta',
    priceField: 'price',
    hrefTemplate: '',
  },
  limit: 8,
  look: 'card',
  perView: { base: 1, md: 2, lg: 3 },
  align: 'start',
  peek: true,
  ratio: 'portrait',
  gap: { base: '3', md: '5' },
  arrows: 'below',
  dots: true,
  autoplay: 0,
  loop: false,
  onClick: 'link',
  style: {},
  elements: {},
};
