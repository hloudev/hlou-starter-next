/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { TextProps } from './schema';
import { textDefaults } from './defaults';

import { renderRichText } from '../../richtext';
import { blockParts, literal } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const ALIGN: Record<TextProps['align'], { root: string; body: string }> = {
  start: { root: '', body: '' },
  center: { root: 'text-center', body: 'mx-auto' },
};

/* A readable measure, or the full content box. */
const WIDTH: Record<TextProps['width'], string> = {
  narrow: 'max-w-[68ch]',
  wide: '',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function TextBlock(props: BlockProps<TextProps>): ReactElement {
  const align = ALIGN[props.align] ?? ALIGN.start;
  /* A primitive on its own row breathes less than a composed section. */
  const { root, el } = blockParts(props, 'text', cx('[--site-pad-y:18px]', align.root));
  const body = literal(props.body, textDefaults.body);

  return (
    <div {...root}>
      <div className="mx-auto w-full max-w-site-content in-[.hl-slot]:max-w-none">
        <div
          {...el(
            'body',
            cx(
              'hl-rich text-site-sm leading-[1.65] text-site-ink-soft',
              WIDTH[props.width],
              align.body
            )
          )}
        >
          {renderRichText(body)}
        </div>
      </div>
    </div>
  );
}
