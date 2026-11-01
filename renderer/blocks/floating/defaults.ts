/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { FloatingProps } from './schema';
import { DEFAULT_POSITION } from './position';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const floatingDefaults: FloatingProps = {
  position: { base: DEFAULT_POSITION },
  style: {},
  content: [],
};
