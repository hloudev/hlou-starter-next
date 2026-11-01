/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { QuoteProps } from './schema';
import { quoteDefaults } from './defaults';

import { blockParts, FloatingLayer, literal } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const ALIGN: Record<QuoteProps['align'], { root: string; quote: string }> = {
  start: { root: '', quote: '' },
  center: { root: 'text-center', quote: 'mx-auto' },
};

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function QuoteBlock(props: BlockProps<QuoteProps>): ReactElement {
  const align = ALIGN[props.align] ?? ALIGN.center;
  const { root, el } = blockParts(props, 'quote', align.root);
  const quote = literal(props.quote, quoteDefaults.quote as string);

  return (
    <section {...root}>
      <figure className="relative mx-auto w-full max-w-site-content">
        <blockquote
          {...el(
            'quote',
            cx(
              'mb-3.5 max-w-[30ch] font-heading text-[length:calc(var(--site-type-lg)*0.92)] leading-[1.35]',
              align.quote
            )
          )}
        >
          <p>“{quote}”</p>
        </blockquote>
        {props.by ? (
          <figcaption {...el('by', 'text-site-xs tracking-[0.08em] text-site-ink-soft uppercase')}>
            {literal(props.by, '')}
          </figcaption>
        ) : null}
        <FloatingLayer slot={props.floating} />
      </figure>
    </section>
  );
}
