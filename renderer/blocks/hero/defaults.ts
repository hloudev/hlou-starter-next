/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { HeroProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const heroDefaults: HeroProps = {
  image: null,
  eyebrow: 'Maison d’hôtes',
  title: 'Des chambres qui prennent leur temps',
  description: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Quatre chambres, un patio et une table d’hôtes, à dix minutes de la médina.',
          },
        ],
      },
    ],
  },
  buttons: [
    { label: 'Voir les chambres', href: '/rooms', variant: 'primary' },
    { label: 'Nous écrire', href: '/contact', variant: 'ghost' },
  ],
  align: 'start',
  gap: { base: '8', md: '12' },
  mediaRatio: { base: '4/5' },
  style: {},
  elements: {},
  floating: [],
};
