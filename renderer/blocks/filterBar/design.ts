/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { FilterBarStoredProps } from './schema';

import { densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** Filters over a listing. */
export const filterBarDesign: BlockDesign<FilterBarStoredProps> = {
  role: 'listing',
  variants: [
    {
      key: 'inline',
      labelKey: 'Design.variants.filterBar.inline',
      thumbnail: 'filter-bar',
      props: { sticky: false },
    },
    {
      key: 'sticky',
      labelKey: 'Design.variants.filterBar.sticky',
      thumbnail: 'filter-bar',
      props: { sticky: true },
    },
  ],
  designOptions: [densityOption<FilterBarStoredProps>()],
};
