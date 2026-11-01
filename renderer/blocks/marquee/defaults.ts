/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { MarqueeProps } from './schema';

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

export const marqueeDefaults: MarqueeProps = {
  items: [
    { text: 'Identité', media: null },
    { text: 'Sites', media: null },
    { text: 'Éditions', media: null },
    { text: 'Expositions', media: null },
    { text: 'Films', media: null },
  ],
  speed: 'base',
  direction: 'start',
  pauseOnHover: true,
  separator: '✦',
  size: 'md',
  style: {},
  elements: {},
};
