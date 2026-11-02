/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { StackProps } from './schema';
import { stackDefaults } from './defaults';

import { blockParts, FloatingLayer, SlotArea } from '../shared';
import { cx, FLEX_DIRECTION_CLASSES, gapClasses, responsiveLiteralClasses } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const ALIGN: Record<StackProps['align'], string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const JUSTIFY: Record<StackProps['justify'], string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

/* Nested in another layout block, a `wide` box gives up its cap. */
const WIDTH: Record<StackProps['width'], string> = {
  narrow: 'max-w-[68ch]',
  wide: 'max-w-site-content in-[.hl-slot]:max-w-none',
  full: 'max-w-none',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * A flex row or column of blocks. Each child is a block with its own
 * width; the stack decides the axis, the gap and how the children line up —
 * what a Figma auto-layout frame says, one for one.
 */
export function StackBlock(props: BlockProps<StackProps>): ReactElement {
  const { root } = blockParts(props, 'stack');
  const direction = responsiveLiteralClasses(props.direction, FLEX_DIRECTION_CLASSES, 'column');
  const gap = gapClasses(props.gap);

  return (
    <section {...root}>
      <div className={cx('relative mx-auto w-full', WIDTH[props.width] ?? WIDTH.wide)}>
        <SlotArea
          slot={props.content}
          layout={cx(
            'flex',
            direction,
            props.wrap && 'flex-wrap',
            ALIGN[props.align] ?? ALIGN.center,
            JUSTIFY[props.justify] ?? JUSTIFY.start,
            gap.length > 0 ? gap : gapClasses(stackDefaults.gap)
          )}
        />
        <FloatingLayer slot={props.floating} />
      </div>
    </section>
  );
}
