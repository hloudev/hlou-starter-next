/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { FormProps } from './schema';
import { FormBlock, resolveFormEndpoint } from './Component';
import { formDefaults } from './defaults';
import { formDesign } from './design';
import { formSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const formBlock: BlockDefinition<typeof formSchema, FormProps> = {
  key: 'form',
  label: 'form',
  category: 'library',
  ...formDesign,
  schema: formSchema,
  defaults: formDefaults,
  Component: FormBlock,
  bindable: ['title', 'description'],
  formProps: ['source'],
};

export { formSchema, formDefaults, FormBlock, resolveFormEndpoint };
export type { FormProps };
