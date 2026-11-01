/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { QuoteProps } from './schema';

import { alignOption, densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** A testimonial or pull quote. */
export const quoteDesign: BlockDesign<QuoteProps> = {
  role: 'quote',
  variants: [
    {
      key: 'centered',
      labelKey: 'Design.variants.quote.centered',
      thumbnail: 'quote',
      props: { align: 'center' },
    },
    {
      key: 'start',
      labelKey: 'Design.variants.quote.start',
      thumbnail: 'quote',
      props: { align: 'start' },
    },
  ],
  designOptions: [
    densityOption<QuoteProps>(),
    alignOption<QuoteProps, 'align'>('align', ['start', 'center']),
  ],
};
