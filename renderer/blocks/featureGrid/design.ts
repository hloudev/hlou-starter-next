/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { FeatureGridProps } from './schema';

import { alignOption, columnsOption, densityOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** A compact grid of features. */
export const featureGridDesign: BlockDesign<FeatureGridProps> = {
  role: 'features',
  variants: [
    {
      key: 'three-up',
      labelKey: 'Design.variants.featureGrid.three-up',
      thumbnail: 'features-3',
      props: { columns: 3 },
    },
    {
      key: 'two-up',
      labelKey: 'Design.variants.featureGrid.two-up',
      thumbnail: 'features-2x2',
      props: { columns: 2 },
    },
    {
      key: 'list',
      labelKey: 'Design.variants.featureGrid.list',
      thumbnail: 'list-rows',
      props: { columns: 1, bordered: false },
    },
  ],
  designOptions: [
    densityOption<FeatureGridProps>(),
    columnsOption<FeatureGridProps, 'columns'>('columns', [1, 2, 3]),
    alignOption<FeatureGridProps, 'titleAlign'>('titleAlign', ['start', 'center']),
    {
      key: 'cards',
      labelKey: 'Design.designOptions.cards.label',
      choices: [
        {
          value: 'plain',
          labelKey: 'Design.designOptions.cards.plain',
          props: { bordered: false },
          elements: { cards: { background: { role: 'paper' } } },
        },
        {
          value: 'filled',
          labelKey: 'Design.designOptions.cards.filled',
          props: { bordered: false },
        },
        {
          value: 'line',
          labelKey: 'Design.designOptions.cards.line',
          props: { bordered: true },
          elements: { cards: { background: { role: 'paper' } } },
        },
      ],
    },
  ],
};
