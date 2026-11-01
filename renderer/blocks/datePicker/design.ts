/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockVariant } from '../design-options';
import type { DatePickerProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** The two looks, for the Insert panel's tiles. No role: a picker sits in a parcours. */
export const datePickerVariants: Array<BlockVariant<DatePickerProps>> = [
  {
    key: 'split',
    labelKey: 'Design.variants.datePicker.split',
    thumbnail: 'form',
    props: { look: 'split' },
  },
  {
    key: 'field',
    labelKey: 'Design.variants.datePicker.field',
    thumbnail: 'form',
    props: { look: 'field' },
  },
];
