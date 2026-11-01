/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { FooterProps } from './schema';

import { densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** The site footer. */
export const footerDesign: BlockDesign<FooterProps> = {
  role: 'footer',
  variants: [
    {
      key: 'ink',
      labelKey: 'Design.variants.footer.ink',
      thumbnail: 'footer',
      props: { theme: 'ink' },
    },
    {
      key: 'paper',
      labelKey: 'Design.variants.footer.paper',
      thumbnail: 'footer-slim',
      props: { theme: 'paper' },
    },
  ],
  designOptions: [densityOption<FooterProps>()],
};
