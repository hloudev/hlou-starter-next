/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { FilterBarProps } from './schema';

import { blockParts, collectionOf, fieldAttr, literal } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/*
 * Plain Tailwind (decision 59). The active chip is `aria-pressed`, so its
 * look is a variant of the chip's own utilities: a designer's chip style
 * replaces the resting look and leaves the pressed one standing.
 */
const STICKY = {
  on: 'sticky top-0 z-9',
  off: '',
} as const;

const CHIP_CLASSES =
  'cursor-pointer rounded-site-pill border border-site-hairline-strong bg-transparent px-3 py-1.5 font-[inherit] text-site-xs text-site-ink aria-pressed:border-site-accent aria-pressed:bg-site-accent-soft aria-pressed:text-site-accent';

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function FilterBarBlock(props: BlockProps<FilterBarProps>): ReactElement {
  const { root, context, el, item } = blockParts(
    props,
    'filterBar',
    cx('bg-site-paper py-4', props.sticky ? STICKY.on : STICKY.off)
  );
  const collection = collectionOf(props.source);

  return (
    <div {...root} role="group">
      <div
        className="mx-auto flex w-full max-w-site-content flex-wrap items-center gap-2"
        {...fieldAttr(context, 'chips')}
      >
        {props.chips.map((chip, index) => (
          <button
            key={`${chip.label}-${index}`}
            type="button"
            aria-pressed={index === 0}
            {...item('chips', index, chip, CHIP_CLASSES, 'chips')}
          >
            {literal(chip.label, '')}
          </button>
        ))}
        {collection ? (
          <span {...el('countLabel', 'ms-auto text-site-xs text-site-ink-soft')}>
            {collection.records.length} {literal(props.countLabel, '')}
          </span>
        ) : null}
      </div>
    </div>
  );
}
