/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { QuantityProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const quantityDefaults: QuantityProps = {
  bind: null,
  label: '',
  hint: '',
  showPrice: true,
  unitLabel: '/ personne',
  source: null,
  mapping: { imageField: '', metaField: '', iconField: '' },
  style: {},
  elements: {},
};
