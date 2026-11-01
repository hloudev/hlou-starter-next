/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { DatePickerProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const datePickerDefaults: DatePickerProps = {
  bind: { path: '' },
  label: 'Dates de séjour',
  fromLabel: 'Arrivée',
  toLabel: 'Départ',
  look: 'split',
  months: 'auto',
  weekStart: 'locale',
  disabledDates: [],
  style: {},
  elements: {},
};
