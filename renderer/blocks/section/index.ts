/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from '../types';
import type { SectionProps } from './schema';
import { SectionBlock } from './Component';
import { sectionDefaults } from './defaults';
import { sectionSchema } from './schema';

import { densityOption, propOption } from '../design-options';

/* -------------------------------------------------------------------------- */
/*                                   BLOCK                                    */
/* -------------------------------------------------------------------------- */

export const sectionBlock: BlockDefinition<typeof sectionSchema, SectionProps> = {
  key: 'section',
  label: 'section',
  category: 'layout',
  schema: sectionSchema,
  defaults: sectionDefaults,
  Component: SectionBlock,
  bindable: [],
  /* A layout block: no role or variants of its own — a Structure section
     node carries its role (M33-09) — but the section looks (M33-13). */
  designOptions: [
    densityOption<SectionProps>(),
    propOption<SectionProps, 'width'>('container', 'width', [
      ['contained', 'wide'],
      ['full', 'full'],
    ]),
  ],
};

export { sectionSchema, sectionDefaults, SectionBlock };
export type { SectionProps };
