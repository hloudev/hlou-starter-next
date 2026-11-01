/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { DatePickerProps } from './schema';
import { DatePickerBlock } from './Component';
import { datePickerDefaults } from './defaults';
import { datePickerVariants } from './design';
import { datePickerSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const datePickerBlock: BlockDefinition<typeof datePickerSchema, DatePickerProps> = {
  key: 'datePicker',
  label: 'datePicker',
  category: 'interactive',
  schema: datePickerSchema,
  defaults: datePickerDefaults,
  Component: DatePickerBlock,
  bindable: [],
  variants: datePickerVariants,
};

export { datePickerSchema, datePickerDefaults, DatePickerBlock };
export type { DatePickerProps };
