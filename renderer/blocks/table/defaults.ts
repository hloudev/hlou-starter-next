/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { TableProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const tableDefaults: TableProps = {
  caption: '',
  head: [{ text: 'Chambre' }, { text: 'Capacité' }, { text: 'À partir de' }],
  rows: [
    { cells: [{ text: 'Jasmin' }, { text: '2 personnes' }, { text: '95 €' }] },
    { cells: [{ text: 'Olivier' }, { text: '2 personnes' }, { text: '110 €' }] },
    { cells: [{ text: 'Suite Terrasse' }, { text: '4 personnes' }, { text: '180 €' }] },
  ],
  striped: true,
  compact: false,
  style: {},
  elements: {},
};
