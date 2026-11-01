/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { styleProps } from '../style-props';

/** What a click on the canvas can pick inside the step indicator — each styleable. */
export const STEPS_ELEMENTS = ['items', 'current'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/**
 * The step indicator (M40-14): where a visitor is in the nearest scope's
 * steps (`$step`) — « 1 Dates · 2 Extras · 3 Coordonnées ». Its labels are
 * the scope's; moving on stays a button's `step.next` (which validates).
 */
export const stepsSchema = z.object({
  /** A done step is a button back to it (`step.go`); an upcoming one never is. */
  clickable: z.boolean(),
  showLabels: z.boolean(),
  /** `auto`: the row from 768 px, « Étape 2 sur 4 » under it; `always`: that line everywhere. */
  compact: z.enum(['auto', 'always']),
  ...styleProps(STEPS_ELEMENTS),
});
export type StepsProps = z.infer<typeof stepsSchema>;
