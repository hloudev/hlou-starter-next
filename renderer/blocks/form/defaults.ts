/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { FormStoredProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const formDefaults: FormStoredProps = {
  source: null,
  title: 'Nous écrire',
  description: 'Une question, une date en tête ? Nous répondons sous 24 h.',
  submitLabel: 'Envoyer',
  successMessage: 'Merci, votre message est bien parti.',
  errorMessage: 'L’envoi a échoué. Réessayez dans un instant.',
  style: {},
  elements: {},
  floating: [],
};
