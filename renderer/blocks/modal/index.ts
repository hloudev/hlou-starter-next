/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { ModalProps } from './schema';
import { ModalBlock } from './Component';
import { modalDefaults } from './defaults';
import { modalSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const modalBlock: BlockDefinition<typeof modalSchema, ModalProps> = {
  key: 'modal',
  label: 'modal',
  category: 'layout',
  schema: modalSchema,
  defaults: modalDefaults,
  Component: ModalBlock,
  bindable: ['title'],
};

export { modalSchema, modalDefaults, ModalBlock };
export type { ModalProps };
