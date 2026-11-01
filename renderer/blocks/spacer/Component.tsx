/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { SpacerProps } from './schema';

import { blockParts, cssNumber } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/** The canvas-only look: a hatched band with a dashed outline. */
const EDITING =
  'bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,color-mix(in_srgb,var(--site-ink)_3%,transparent)_10px,color-mix(in_srgb,var(--site-ink)_3%,transparent)_20px)] outline-1 -outline-offset-1 outline-dashed outline-site-hairline-strong';

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/** Vertical breathing room. Invisible on the site; a dashed band on the canvas. */
export function SpacerBlock(props: BlockProps<SpacerProps>): ReactElement {
  const { root, context } = blockParts(props, 'spacer', 'p-0');
  const editing = context.mode !== 'static';

  return (
    <div
      {...root}
      className={cx(root.className, editing && EDITING)}
      style={{ ...root.style, blockSize: `${cssNumber(props.height, 200) ?? 0}px` }}
      aria-hidden="true"
    />
  );
}
