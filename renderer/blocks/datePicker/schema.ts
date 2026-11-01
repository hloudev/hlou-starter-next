/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { BoundMeta } from '../../contracts';

import { boundSchema } from '../../contracts';
import { isoDateSchema } from '../../state/schema';
import { styleProps } from '../style-props';

/** What a click on the canvas can pick inside the picker — each styleable. */
export const DATE_PICKER_ELEMENTS = ['label', 'field', 'calendar'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/**
 * A date picker (M40-12) bound to a `date` or `dateRange` field of the
 * enclosing scope. No `mode`: single or range follows the field's type, and
 * `min` / `minNights` / `maxNights` come from the field — one source of
 * truth. Unbound (no scope, or a path the scope lacks), it draws inert.
 */
export const datePickerSchema = z.object({
  bind: z.object({ path: z.string().meta({ hl: 'statePath' } satisfies BoundMeta) }).nullable(),
  label: boundSchema(z.string()),
  /* A split range's two fields; blank reads the site's « Arrivée » / « Départ ». */
  fromLabel: boundSchema(z.string()),
  toLabel: boundSchema(z.string()),
  /** A range as one field, or two side by side. A single date is always one. */
  look: z.enum(['field', 'split']),
  /** `auto`: one month under 768 px, two from there. */
  months: z.enum(['auto', 'one', 'two']),
  weekStart: z.enum(['locale', 'monday', 'sunday', 'saturday']),
  /** Days no one can pick (a stay cannot span them), `YYYY-MM-DD`. */
  disabledDates: z.array(isoDateSchema).max(366),
  ...styleProps(DATE_PICKER_ELEMENTS),
});
export type DatePickerProps = z.infer<typeof datePickerSchema>;
