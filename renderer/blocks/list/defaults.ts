/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ListProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const listDefaults: ListProps = {
  items: [
    { text: 'Petit-déjeuner servi dans le patio' },
    { text: 'Linge de maison en lin lavé' },
    { text: 'Parking à deux rues' },
  ],
  variant: 'bullets',
  width: 'narrow',
  style: {},
  elements: {},
};
