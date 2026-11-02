/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { HeaderProps } from './schema';

import { densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** The site header. */
export const headerDesign: BlockDesign<HeaderProps> = {
  role: 'header',
  variants: [
    {
      key: 'static',
      labelKey: 'Design.variants.header.static',
      thumbnail: 'header',
      props: { sticky: false },
    },
    {
      key: 'sticky',
      labelKey: 'Design.variants.header.sticky',
      thumbnail: 'navbar-split',
      props: { sticky: true },
    },
    /* Transparent over the block below, taking its paper on scroll —
       meant for one page, through the instance's override. */
    {
      key: 'overlay',
      labelKey: 'Design.variants.header.overlay',
      thumbnail: 'navbar-center',
      props: { sticky: true, overlay: true },
    },
    /* A burger at every width opening the full-screen menu. */
    {
      key: 'fullscreen',
      labelKey: 'Design.variants.header.fullscreen',
      thumbnail: 'navbar-burger',
      props: { menuStyle: 'fullscreen' },
    },
  ],
  designOptions: [densityOption<HeaderProps>()],
};
