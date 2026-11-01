/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { LogoCloudProps } from './schema';

import { densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** A row of logos. */
export const logoCloudDesign: BlockDesign<LogoCloudProps> = {
  role: 'logos',
  variants: [
    {
      key: 'row',
      labelKey: 'Design.variants.logoCloud.row',
      thumbnail: 'logos-row',
      props: { columns: { base: 2, md: 5 }, size: 'md' },
    },
    {
      key: 'grid',
      labelKey: 'Design.variants.logoCloud.grid',
      thumbnail: 'grid-2x3',
      props: { columns: { base: 2, md: 3 }, size: 'lg' },
    },
    {
      key: 'compact',
      labelKey: 'Design.variants.logoCloud.compact',
      thumbnail: 'logos-row',
      props: { columns: { base: 3, md: 6 }, size: 'sm' },
    },
  ],
  designOptions: [densityOption<LogoCloudProps>()],
};
