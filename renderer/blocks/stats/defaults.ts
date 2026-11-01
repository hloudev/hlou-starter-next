/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { StatsProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const statsDefaults: StatsProps = {
  items: [
    { value: '4', label: 'chambres' },
    { value: '1932', label: 'année de construction' },
    { value: '10 min', label: 'de la médina' },
    { value: '4,9', label: 'note moyenne' },
  ],
  rule: 'both',
  style: {},
  elements: {},
  floating: [],
};
