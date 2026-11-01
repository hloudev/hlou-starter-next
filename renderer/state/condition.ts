/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMAS                                  */
/* -------------------------------------------------------------------------- */

/* Apart from `schema.ts` on purpose: the document schema imports `when`, and
   the contracts import the document schema — the scope schemas, which import
   the contracts, would close the loop. */

export const conditionSchema = z.object({
  path: z.string(),
  op: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'truthy', 'empty']),
  value: z.unknown().optional(),
});
export type Condition = z.infer<typeof conditionSchema>;
export type ConditionOp = Condition['op'];

/** A node field (any block): its conditions, AND-ed. */
export const whenSchema = z.array(conditionSchema).min(1).max(4);
export type When = z.infer<typeof whenSchema>;
