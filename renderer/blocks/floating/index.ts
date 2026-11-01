/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { FloatingProps } from './schema';
import { FloatingBlock } from './Component';
import { floatingDefaults } from './defaults';
import { floatingSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const floatingBlock: BlockDefinition<typeof floatingSchema, FloatingProps> = {
  key: 'floating',
  label: 'floating',
  category: 'layout',
  schema: floatingSchema,
  defaults: floatingDefaults,
  Component: FloatingBlock,
  bindable: [],
};

export { floatingSchema, floatingDefaults, FloatingBlock };
export {
  DEFAULT_POSITION,
  dragPosition,
  positionStyle,
  positionVarsAt,
  readPosition,
} from './position';
export type { FloatingProps };
