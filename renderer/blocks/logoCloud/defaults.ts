/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { LogoCloudProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const logoCloudDefaults: LogoCloudProps = {
  title: 'Ils nous font confiance',
  items: [
    { media: null, href: '', alt: 'Logo 1' },
    { media: null, href: '', alt: 'Logo 2' },
    { media: null, href: '', alt: 'Logo 3' },
    { media: null, href: '', alt: 'Logo 4' },
    { media: null, href: '', alt: 'Logo 5' },
  ],
  columns: { base: 2, md: 5 },
  grayscale: true,
  size: 'md',
  style: {},
  elements: {},
};
