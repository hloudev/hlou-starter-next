/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { FooterProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const footerDefaults: FooterProps = {
  groups: [
    {
      heading: 'Maison',
      items: [
        { label: 'Chambres', href: '/rooms' },
        { label: 'Journal', href: '/journal' },
      ],
    },
    {
      heading: 'Contact',
      items: [
        { label: 'Nous écrire', href: '/contact' },
        { label: 'Venir', href: '/contact#acces' },
      ],
    },
    {
      heading: 'Légal',
      items: [
        { label: 'Mentions légales', href: '/legal' },
        { label: 'Confidentialité', href: '/privacy' },
      ],
    },
  ],
  legal: '© Maison — Tous droits réservés',
  theme: 'ink',
  style: {},
  elements: {},
};
