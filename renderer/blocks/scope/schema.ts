/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { BoundMeta } from '../../contracts';

import { slotContentSchema } from '../../contracts';
import { derivedSchema, scopeFieldSchema, scopeStepSchema } from '../../state/schema';
import { styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/**
 * A scope: typed state for the blocks it holds — `{ $state }`
 * texts, `when` visibility, button actions, widgets. It sits inside a
 * section and never nests: its own slot refuses another scope, and a nested
 * or root-level one renders as a plain container.
 */
export const scopeSchema = z.object({
  fields: z
    .array(scopeFieldSchema)
    .max(24)
    .meta({ hl: 'scopeFields' } satisfies BoundMeta),
  /* The path `$step` reads. */
  steps: z
    .array(scopeStepSchema)
    .max(8)
    .meta({ hl: 'scopeSteps' } satisfies BoundMeta)
    .optional(),
  derived: z
    .array(derivedSchema)
    .max(16)
    .meta({ hl: 'scopeDerived' } satisfies BoundMeta)
    .optional(),
  /** ISO 4217: what amounts are counted in. */
  currency: z.string().length(3).optional(),
  persist: z.enum(['none', 'session']).default('session'),
  content: slotContentSchema.meta({ hl: 'slot', disallow: ['scope'] } satisfies BoundMeta),
  ...styleProps([]),
});
export type ScopeProps = z.infer<typeof scopeSchema>;
