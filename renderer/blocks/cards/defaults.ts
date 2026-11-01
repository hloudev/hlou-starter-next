/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CardsProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const cardsDefaults: CardsProps = {
  title: 'Ce que nous faisons',
  titleAlign: 'start',
  items: [
    {
      media: null,
      icon: { name: 'palette' },
      eyebrow: '01',
      title: 'Identité',
      text: 'Un nom, un ton, une image : la base de tout ce qui suit.',
      href: '',
      buttonLabel: '',
    },
    {
      media: null,
      icon: { name: 'globe' },
      eyebrow: '02',
      title: 'Site web',
      text: 'Pensé pour être lu, rapide à charger, simple à faire vivre.',
      href: '',
      buttonLabel: '',
    },
    {
      media: null,
      icon: { name: 'megaphone' },
      eyebrow: '03',
      title: 'Lancement',
      text: 'Les premiers mois, accompagnés : contenus, campagnes, mesures.',
      href: '',
      buttonLabel: '',
    },
  ],
  columns: { base: 1, md: 3 },
  variant: 'bordered',
  align: 'start',
  style: {},
  elements: {},
  floating: [],
};
