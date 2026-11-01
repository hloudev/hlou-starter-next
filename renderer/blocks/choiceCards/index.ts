/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { ChoiceCardsProps } from './schema';
import { ChoiceCardsBlock } from './Component';
import { choiceCardsDefaults } from './defaults';
import { choiceCardsVariants } from './design';
import { choiceCardsSchema } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const choiceCardsBlock: BlockDefinition<typeof choiceCardsSchema, ChoiceCardsProps> = {
  key: 'choiceCards',
  label: 'choiceCards',
  category: 'interactive',
  schema: choiceCardsSchema,
  defaults: choiceCardsDefaults,
  Component: ChoiceCardsBlock,
  bindable: ['label'],
  collectionProps: ['source'],
  variants: choiceCardsVariants,
};

export { choiceCardsSchema, choiceCardsDefaults, ChoiceCardsBlock };
export type { ChoiceCardsProps };
