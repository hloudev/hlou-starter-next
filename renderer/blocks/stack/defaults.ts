/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { StackProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const stackDefaults: StackProps = {
  direction: { base: 'column', md: 'row' },
  wrap: false,
  align: 'center',
  justify: 'start',
  gap: { base: '6', md: '10' },
  width: 'wide',
  content: [],
  style: {},
  elements: {},
  floating: [],
};
