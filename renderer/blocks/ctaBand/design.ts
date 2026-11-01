/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { CtaBandProps } from './schema';

import { densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** A call-to-action band. */
export const ctaBandDesign: BlockDesign<CtaBandProps> = {
  role: 'cta',
  variants: [
    {
      key: 'accent',
      labelKey: 'Design.variants.ctaBand.accent',
      thumbnail: 'cta-band',
      props: { background: 'accent' },
    },
    {
      key: 'ink',
      labelKey: 'Design.variants.ctaBand.ink',
      thumbnail: 'cta-band',
      props: { background: 'ink' },
    },
    {
      key: 'quiet',
      labelKey: 'Design.variants.ctaBand.quiet',
      thumbnail: 'cta-split',
      props: { background: 'paper' },
    },
  ],
  designOptions: [densityOption<CtaBandProps>()],
};
