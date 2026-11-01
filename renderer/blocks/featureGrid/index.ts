/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { FeatureGridProps } from './schema';
import { FeatureGridBlock } from './Component';
import { featureGridDefaults } from './defaults';
import { featureGridDesign } from './design';
import { featureGridSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const featureGridBlock: BlockDefinition<typeof featureGridSchema, FeatureGridProps> = {
  key: 'featureGrid',
  label: 'featureGrid',
  category: 'library',
  ...featureGridDesign,
  schema: featureGridSchema,
  defaults: featureGridDefaults,
  Component: FeatureGridBlock,
  bindable: ['title'],
};

export { featureGridSchema, featureGridDefaults, FeatureGridBlock };
export type { FeatureGridProps };
