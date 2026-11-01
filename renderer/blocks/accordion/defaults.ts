/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { AccordionProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

const paragraph = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

export const accordionDefaults: AccordionProps = {
  title: 'Questions fréquentes',
  items: [
    {
      title: 'Peut-on venir à la journée ?',
      body: paragraph('Oui : un pass journée donne accès aux espaces ouverts et au café.'),
      open: true,
    },
    {
      title: 'Les bureaux sont-ils fermés ?',
      body: paragraph('Les bureaux privatifs ferment à clé ; les open spaces restent partagés.'),
      open: false,
    },
    {
      title: 'Y a-t-il un parking ?',
      body: paragraph('Un parking vélo couvert, et des places voiture sur demande.'),
      open: false,
    },
  ],
  allowMultiple: false,
  icon: 'caret',
  divided: true,
  width: 'narrow',
  style: {},
  elements: {},
};
