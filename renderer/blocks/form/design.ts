/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { FormStoredProps } from './schema';

import { densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** A form bound to a project form. */
export const formDesign: BlockDesign<FormStoredProps> = {
  role: 'contact',
  variants: [
    {
      key: 'standard',
      labelKey: 'Design.variants.form.standard',
      thumbnail: 'form',
    },
    {
      key: 'narrow',
      labelKey: 'Design.variants.form.narrow',
      thumbnail: 'form-split',
      elements: { form: { base: { maxWidth: 'xl' } } },
    },
  ],
  designOptions: [densityOption<FormStoredProps>()],
};
