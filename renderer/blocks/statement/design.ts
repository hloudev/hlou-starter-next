/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDesign } from '../design-options';
import type { StatementProps } from './schema';

import { alignOption, densityOption, propOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   DESIGN                                   */
/* -------------------------------------------------------------------------- */

/** One oversized sentence. */
export const statementDesign: BlockDesign<StatementProps> = {
  role: 'content',
  variants: [
    {
      key: 'lead',
      labelKey: 'Design.variants.statement.lead',
      thumbnail: 'text-single',
      props: { size: 'xl', align: 'start', maxWidth: 'wide' },
    },
    {
      key: 'manifesto',
      labelKey: 'Design.variants.statement.manifesto',
      thumbnail: 'hero-copy',
      props: { size: '3xl', align: 'center', maxWidth: 'wide' },
    },
    {
      key: 'narrow',
      labelKey: 'Design.variants.statement.narrow',
      thumbnail: 'text-single',
      props: { size: 'lg', align: 'start', maxWidth: 'narrow' },
    },
  ],
  designOptions: [
    densityOption<StatementProps>(),
    alignOption<StatementProps, 'align'>('align', ['start', 'center', 'end']),
    propOption<StatementProps, 'maxWidth'>('container', 'maxWidth', [
      ['contained', 'wide'],
      ['full', 'full'],
    ]),
  ],
};
