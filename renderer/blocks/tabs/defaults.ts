/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { TabsProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const tabsDefaults: TabsProps = {
  tabs: [{ label: 'Présentation' }, { label: 'Équipements' }, { label: 'Tarifs' }],
  look: 'underline',
  align: 'start',
  panel1: [],
  panel2: [],
  panel3: [],
  panel4: [],
  panel5: [],
  panel6: [],
  style: {},
  elements: {},
};
