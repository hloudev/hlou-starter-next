/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ChoiceCardsProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const choiceCardsDefaults: ChoiceCardsProps = {
  bind: null,
  label: '',
  look: 'cards',
  columns: { base: 1, md: 2 },
  showPrice: true,
  decor: [],
  source: null,
  mapping: { imageField: '', metaField: '', iconField: '' },
  style: {},
  elements: {},
};
