/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockVariant } from '../design-options';
import type { ChoiceCardsProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** The three looks, for the Insert panel's tiles. No role: choices sit in a scope. */
export const choiceCardsVariants: Array<BlockVariant<ChoiceCardsProps>> = [
  {
    key: 'cards',
    labelKey: 'Design.variants.choiceCards.cards',
    thumbnail: 'list-cards',
    props: { look: 'cards' },
  },
  {
    key: 'segmented',
    labelKey: 'Design.variants.choiceCards.segmented',
    thumbnail: 'filter-bar',
    props: { look: 'segmented' },
  },
  {
    key: 'list',
    labelKey: 'Design.variants.choiceCards.list',
    thumbnail: 'list-rows',
    props: { look: 'list' },
  },
];
