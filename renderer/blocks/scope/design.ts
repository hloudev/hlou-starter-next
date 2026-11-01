/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockVariant } from '../design-options';
import type { ScopeProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/**
 * One variant, for the Insert panel's tile. No role: every section role
 * names a section, and a scope sits inside one.
 */
export const scopeVariants: Array<BlockVariant<ScopeProps>> = [
  { key: 'default', labelKey: 'Design.variants.scope.default', thumbnail: 'scope' },
];
