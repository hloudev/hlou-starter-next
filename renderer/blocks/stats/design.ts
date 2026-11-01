/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { StatsProps } from './schema';

import { densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** A row of key figures. */
export const statsDesign: BlockDesign<StatsProps> = {
  role: 'stats',
  variants: [
    {
      key: 'ruled',
      labelKey: 'Design.variants.stats.ruled',
      thumbnail: 'stats-row',
      props: { rule: 'both' },
    },
    {
      key: 'top-rule',
      labelKey: 'Design.variants.stats.top-rule',
      thumbnail: 'stats-row',
      props: { rule: 'top' },
    },
    {
      key: 'open',
      labelKey: 'Design.variants.stats.open',
      thumbnail: 'stats-row',
      props: { rule: 'none' },
    },
  ],
  designOptions: [densityOption<StatsProps>()],
};
