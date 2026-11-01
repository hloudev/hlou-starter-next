/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ShapeProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const shapeDefaults: ShapeProps = {
  kind: 'ellipse',
  stroke: { role: 'accent' },
  strokeWidth: 3,
  handDrawn: true,
  width: 240,
  height: 96,
  rotate: -4,
  style: {},
  elements: {},
};
