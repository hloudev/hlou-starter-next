/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { HeroProps } from './schema';

import { alignOption, densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** The opening section: copy beside, over or above the image. */
export const heroDesign: BlockDesign<HeroProps> = {
  role: 'hero',
  variants: [
    {
      key: 'split-end',
      labelKey: 'Design.variants.hero.split-end',
      thumbnail: 'hero-left',
      props: { layout: 'split-end' },
    },
    {
      key: 'split-start',
      labelKey: 'Design.variants.hero.split-start',
      thumbnail: 'hero-right',
      props: { layout: 'split-start' },
    },
    {
      key: 'stacked',
      labelKey: 'Design.variants.hero.stacked',
      thumbnail: 'hero-center',
      props: { layout: 'stacked', align: 'center' },
    },
    {
      key: 'overlay',
      labelKey: 'Design.variants.hero.overlay',
      thumbnail: 'hero-full',
      props: { layout: 'overlay' },
    },
    {
      /* M40-08: add images under « Diapositives » and they cross-fade. */
      key: 'slider',
      labelKey: 'Design.variants.hero.slider',
      thumbnail: 'hero-full',
      props: { layout: 'overlay', autoplay: 6 },
    },
  ],
  designOptions: [
    densityOption<HeroProps>(),
    alignOption<HeroProps, 'align'>('align', ['start', 'center', 'end']),
  ],
};
