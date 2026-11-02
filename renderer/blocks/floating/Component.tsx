/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { FloatingProps } from './schema';
import { positionStyle } from './position';

import { blockParts, SlotArea, styleVars } from '../shared';
import { cx, hasFrameWidth } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * Out of flow, over the host block. Its offsets are variables
 * (`position.ts`) read by fixed utilities; its own box is the shared `style`,
 * over a `p-0` default that cancels the density padding every `.hl-blk` gets.
 */
export function FloatingBlock(props: BlockProps<FloatingProps>): ReactElement {
  const { root, context } = blockParts(props, 'floating', 'p-0');
  const { vars, classes } = positionStyle(props.position, context.dir);
  /* Width has two possible sources: the canvas's frame handles (`--bw`, on
     every element) and this block's own legacy `position.width` (`--fw`).
     The frame wins where it is set, so the element never carries two. */
  const framed = hasFrameWidth(props.style);

  return (
    <div
      {...root}
      className={cx(
        root.className,
        'absolute start-(--fs) end-(--fe) top-(--ft) bottom-(--fb) z-(--fz) translate-x-(--ftx) translate-y-(--fty)',
        /* Converted into a free section's grid: a cell of it, in flow. */
        'free:static free:translate-none',
        framed ? '' : 'w-(--fw)',
        classes
      )}
      style={{ ...styleVars(vars), ...root.style }}
    >
      <SlotArea slot={props.content} className="hl-float__content" />
    </div>
  );
}
