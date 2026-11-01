/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { MediaTextProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const mediaTextDefaults: MediaTextProps = {
  media: null,
  mediaSide: 'start',
  mediaRatio: { base: '4/5' },
  split: '1-1',
  verticalAlign: 'center',
  eyebrow: 'Notre approche',
  title: 'Un lieu pensé pour ceux qui y travaillent',
  text: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Des espaces lumineux, du mobilier choisi, et une équipe présente sans être partout.',
          },
        ],
      },
    ],
  },
  buttons: [{ label: 'En savoir plus', href: '/about', variant: 'ghost' }],
  style: {},
  elements: {},
  floating: [],
};
