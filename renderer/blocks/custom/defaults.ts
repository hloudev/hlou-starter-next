/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CustomProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const customDefaults: CustomProps = {
  eyebrow: '',
  title: 'Section sur mesure',
  text: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Cette section attend son code : Design › Code, ou l’agent, lui donnent sa forme.',
          },
        ],
      },
    ],
  },
  items: [],
  media: [],
  buttons: [],
  data: {},
  style: {},
  elements: {},
  floating: [],
};
