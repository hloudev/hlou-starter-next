/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { HeaderProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const headerDefaults: HeaderProps = {
  logo: 'Maison',
  links: [
    { label: 'Accueil', href: '/' },
    { label: 'Chambres', href: '/rooms' },
    { label: 'Journal', href: '/journal' },
    { label: 'Contact', href: '/contact' },
  ],
  ctaLabel: 'Réserver',
  ctaHref: '/contact',
  sticky: false,
  /* New headers get the burger on a phone; a stored header without the prop
     keeps its inline links. */
  menuStyle: 'drawer',
  style: {},
  elements: {},
};
