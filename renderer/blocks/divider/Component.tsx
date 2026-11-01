/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { DividerProps } from './schema';

import { blockParts } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const VARIANT: Record<DividerProps['variant'], string> = {
  line: 'border-t border-solid border-site-hairline-strong',
  dashed: 'border-t border-dashed border-site-hairline-strong',
  /* A short row of dots, centred. */
  dots: 'h-1 bg-[radial-gradient(circle,var(--site-ink-soft)_1.5px,transparent_1.6px)] bg-size-[12px_4px] bg-repeat-x',
};

/* `wide` follows the content box — except the dots, which stay a short row. */
const WIDTH: Record<DividerProps['width'], string> = {
  narrow: 'max-w-[68ch]',
  wide: 'max-w-site-content',
  full: 'max-w-none',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function DividerBlock(props: BlockProps<DividerProps>): ReactElement {
  /* A thin band: the rule, and a little air above and below it. */
  const { root } = blockParts(props, 'divider', '[--site-pad-y:8px]');
  const variant = VARIANT[props.variant] ? props.variant : 'line';
  const width =
    variant === 'dots' && props.width === 'wide' ? 'max-w-16' : (WIDTH[props.width] ?? WIDTH.wide);

  return (
    <div {...root}>
      <hr className={cx('mx-auto my-0 w-full border-0', VARIANT[variant], width)} />
    </div>
  );
}
