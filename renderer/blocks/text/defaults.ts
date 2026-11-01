/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { TextProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const textDefaults: TextProps = {
  body: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Un paragraphe de texte riche — gras, italique, liens et listes, tel que le rédacteur l’écrit.',
          },
        ],
      },
    ],
  },
  align: 'start',
  width: 'narrow',
  style: {},
  elements: {},
};
