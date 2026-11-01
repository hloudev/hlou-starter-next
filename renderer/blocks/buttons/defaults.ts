/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ButtonsProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const buttonsDefaults: ButtonsProps = {
  items: [
    { label: 'Réserver', href: '/contact', variant: 'primary' },
    { label: 'Voir les chambres', href: '/rooms', variant: 'ghost' },
  ],
  align: 'start',
  style: {},
  elements: {},
};
