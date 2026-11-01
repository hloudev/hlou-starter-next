/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { MarqueeProps } from './schema';

import { densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** A self-scrolling line of words or logos. */
export const marqueeDesign: BlockDesign<MarqueeProps> = {
  role: 'logos',
  variants: [
    {
      key: 'words',
      labelKey: 'Design.variants.marquee.words',
      thumbnail: 'carousel',
      props: { size: 'lg', speed: 'base' },
    },
    {
      key: 'ticker',
      labelKey: 'Design.variants.marquee.ticker',
      thumbnail: 'logos-row',
      props: { size: 'sm', speed: 'fast' },
    },
  ],
  designOptions: [densityOption<MarqueeProps>()],
};
