/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { ShapeProps } from './schema';
import { ShapeBlock } from './Component';
import { shapeDefaults } from './defaults';
import { SHAPE_KINDS, shapeSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const shapeBlock: BlockDefinition<typeof shapeSchema, ShapeProps> = {
  key: 'shape',
  label: 'shape',
  category: 'blocks',
  schema: shapeSchema,
  defaults: shapeDefaults,
  Component: ShapeBlock,
  bindable: [],
};

export { shapeSchema, shapeDefaults, ShapeBlock, SHAPE_KINDS };
export type { ShapeProps };
