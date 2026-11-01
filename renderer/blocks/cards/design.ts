/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { CardsProps } from './schema';

import { alignOption, densityOption, responsiveColumnsOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** A grid of cards. */
export const cardsDesign: BlockDesign<CardsProps> = {
  role: 'features',
  variants: [
    {
      key: 'grid-3',
      labelKey: 'Design.variants.cards.grid-3',
      thumbnail: 'features-3',
      props: { columns: { base: 1, md: 3 } },
    },
    {
      key: 'grid-2',
      labelKey: 'Design.variants.cards.grid-2',
      thumbnail: 'features-2x2',
      props: { columns: { base: 1, md: 2 } },
    },
    {
      key: 'grid-4',
      labelKey: 'Design.variants.cards.grid-4',
      thumbnail: 'features-4',
      props: { columns: { base: 1, md: 2, lg: 4 } },
    },
    {
      key: 'image-top',
      labelKey: 'Design.variants.cards.image-top',
      thumbnail: 'list-cards',
      props: { columns: { base: 1, md: 3 }, variant: 'image-top' },
    },
    {
      key: 'image-tiles',
      labelKey: 'Design.variants.cards.image-tiles',
      thumbnail: 'tiles-4',
      props: { columns: { base: 1, md: 2 }, variant: 'image-bg' },
    },
  ],
  designOptions: [
    densityOption<CardsProps>(),
    responsiveColumnsOption<CardsProps, 'columns'>('columns', [2, 3, 4]),
    alignOption<CardsProps, 'titleAlign'>('titleAlign', ['start', 'center']),
    {
      key: 'cards',
      labelKey: 'Design.designOptions.cards.label',
      /* An image card keeps its layout: the look is the card's box then. */
      choices: (
        [
          ['plain', 'plain'],
          ['filled', 'elevated'],
          ['line', 'bordered'],
        ] as const
      ).map(([value, variant]) => ({
        value,
        labelKey: `Design.designOptions.cards.${value}`,
        apply: (props: CardsProps) =>
          props.variant === 'image-top' || props.variant === 'image-bg' ? {} : { variant },
      })),
    },
  ],
};
