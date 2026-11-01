/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { StatementProps } from './schema';
import { StatementBlock } from './Component';
import { statementDefaults } from './defaults';
import { statementDesign } from './design';
import { statementSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const statementBlock: BlockDefinition<typeof statementSchema, StatementProps> = {
  key: 'statement',
  label: 'statement',
  category: 'library',
  ...statementDesign,
  schema: statementSchema,
  defaults: statementDefaults,
  Component: StatementBlock,
  bindable: ['text'],
};

export { statementSchema, statementDefaults, StatementBlock };
export type { StatementProps };
