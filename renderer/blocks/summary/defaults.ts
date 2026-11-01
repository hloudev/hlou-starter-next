/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { SummaryProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const summaryDefaults: SummaryProps = {
  title: 'Votre réservation',
  media: null,
  rows: [],
  lines: null,
  total: { label: 'Total', path: 'total' },
  after: [],
  sticky: true,
  mobile: 'bar',
  style: {},
  elements: {},
};
