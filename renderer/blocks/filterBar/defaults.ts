/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { FilterBarStoredProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const filterBarDefaults: FilterBarStoredProps = {
  chips: [{ label: 'Toutes' }, { label: 'Patio' }, { label: 'Terrasse' }, { label: 'Suite' }],
  source: null,
  sticky: false,
  countLabel: 'résultats',
  style: {},
  elements: {},
};
