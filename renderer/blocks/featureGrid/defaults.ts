/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { FeatureGridProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const featureGridDefaults: FeatureGridProps = {
  title: 'Ce qui fait la maison',
  titleAlign: 'start',
  cards: [
    {
      icon: '☀',
      title: 'Le patio',
      description: 'Un jardin clos, un citronnier, le petit-déjeuner dehors dès avril.',
    },
    {
      icon: '◌',
      title: 'La table',
      description: 'Une cuisine de saison servie le soir, sur réservation.',
    },
    {
      icon: '⌂',
      title: 'Le quartier',
      description: 'Dix minutes à pied de la médina, loin du bruit.',
    },
  ],
  columns: 3,
  bordered: true,
  style: {},
  elements: {},
  floating: [],
};
