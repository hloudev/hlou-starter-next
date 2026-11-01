/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { AccordionProps } from './schema';

import { densityOption, propOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** Questions and answers. */
export const accordionDesign: BlockDesign<AccordionProps> = {
  role: 'faq',
  variants: [
    {
      key: 'divided',
      labelKey: 'Design.variants.accordion.divided',
      thumbnail: 'faq',
      props: { divided: true, width: 'narrow', icon: 'caret' },
    },
    {
      key: 'open',
      labelKey: 'Design.variants.accordion.open',
      thumbnail: 'faq',
      props: { divided: false, width: 'wide', icon: 'plus' },
    },
  ],
  designOptions: [
    densityOption<AccordionProps>(),
    propOption<AccordionProps, 'width'>('container', 'width', [
      ['contained', 'narrow'],
      ['full', 'wide'],
    ]),
  ],
};
