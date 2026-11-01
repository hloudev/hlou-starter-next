/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { PageHeaderProps } from './schema';

import { densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** An inner page's title band. */
export const pageHeaderDesign: BlockDesign<PageHeaderProps> = {
  role: 'hero',
  variants: [
    {
      key: 'start',
      labelKey: 'Design.variants.pageHeader.start',
      thumbnail: 'page-header',
    },
    {
      key: 'centered',
      labelKey: 'Design.variants.pageHeader.centered',
      thumbnail: 'hero-copy',
      elements: {
        eyebrow: { base: { textAlign: 'center' } },
        title: { base: { textAlign: 'center' } },
      },
    },
  ],
  designOptions: [densityOption<PageHeaderProps>()],
};
