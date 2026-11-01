/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { CustomProps } from './schema';

import { densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** A section a code variant draws. */
export const customDesign: BlockDesign<CustomProps> = {
  role: 'content',
  variants: [
    {
      key: 'start',
      labelKey: 'Design.variants.custom.start',
      thumbnail: 'text-single',
    },
    {
      key: 'centered',
      labelKey: 'Design.variants.custom.centered',
      thumbnail: 'hero-copy',
      elements: {
        eyebrow: { base: { textAlign: 'center' } },
        title: { base: { textAlign: 'center' } },
        text: { base: { textAlign: 'center' } },
      },
    },
  ],
  designOptions: [densityOption<CustomProps>()],
};
