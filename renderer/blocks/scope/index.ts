/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { ScopeProps } from './schema';
import { ScopeBlock } from './Component';
import { scopeDefaults } from './defaults';
import { scopeVariants } from './design';
import { scopeSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const scopeBlock: BlockDefinition<typeof scopeSchema, ScopeProps> = {
  key: 'scope',
  label: 'scope',
  category: 'interactive',
  schema: scopeSchema,
  defaults: scopeDefaults,
  Component: ScopeBlock,
  bindable: [],
  variants: scopeVariants,
};

export { scopeSchema, scopeDefaults, ScopeBlock };
export type { ScopeProps };
