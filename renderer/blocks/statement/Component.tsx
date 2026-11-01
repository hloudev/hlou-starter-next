/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { StatementProps } from './schema';
import { statementDefaults } from './defaults';

import { AccentText } from '../accent';
import { splitAccentWords } from '../heading/Component';
import { bindAttr, blockParts, literal } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/* The two largest sizes are fluid: they must stay one or two lines on a phone. */
const SIZE: Record<StatementProps['size'], string> = {
  lg: 'text-site-lg',
  xl: 'text-site-xl md:text-[calc(var(--site-type-xl)*1.25)]',
  '2xl': 'text-[clamp(2.25rem,6vw,4.5rem)]',
  '3xl': 'text-[clamp(2.75rem,9vw,7rem)]',
};

const ALIGN: Record<StatementProps['align'], string> = {
  start: '',
  center: 'mx-auto text-center',
  end: 'ms-auto text-end',
};

const MAX_WIDTH: Record<StatementProps['maxWidth'], string> = {
  narrow: 'max-w-[24ch]',
  wide: 'max-w-[40ch]',
  full: 'max-w-none',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function StatementBlock(props: BlockProps<StatementProps>): ReactElement {
  const { root, el } = blockParts(props, 'statement');
  const text = literal(props.text, statementDefaults.text as string);

  return (
    <section {...root}>
      <div className="mx-auto w-full max-w-site-content">
        <p
          {...el(
            'text',
            cx(
              'm-0 font-heading leading-[1.05] tracking-[-0.02em] text-balance rtl:tracking-normal',
              SIZE[props.size] ?? SIZE.xl,
              ALIGN[props.align] ?? ALIGN.start,
              MAX_WIDTH[props.maxWidth] ?? MAX_WIDTH.wide
            )
          )}
          {...bindAttr(props, 'text')}
        >
          <AccentText
            text={text}
            words={splitAccentWords(props.accentWords)}
            decoration={props.decoration}
            color={props.decorationColor}
            accent={el('accent', 'text-site-accent')}
          />
        </p>
      </div>
    </section>
  );
}
