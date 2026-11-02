/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { DocScopeEnv } from '../../doc/render';
import type { BlockProps } from '../types';
import type { ScopeProps } from './schema';

import { Island } from '../../render/island';
import { blockParts, SlotArea } from '../shared';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The scope this node opened, as the render pass handed it; `null` when it opened none. */
function openedScope(props: unknown): DocScopeEnv | null {
  const side = isRecord(props) && isRecord(props.__hl) ? props.__hl : null;
  if (side?.opensScope !== true || !isRecord(side.scope)) return null;
  return side.scope as DocScopeEnv;
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * The scope's server shell: its root names the scope and
 * carries its def, its slot draws the blocks as they are, and a child-less
 * island starts the DOM runtime after hydration — no React tree ever wraps
 * the blocks. A scope that opened none (nested, at a page's root, drawn
 * outside `renderDoc`) is a plain container. The canvas runs no runtime.
 */
export function ScopeBlock(props: BlockProps<ScopeProps>): ReactElement {
  const { root, context } = blockParts(props, 'scope');
  const scope = openedScope(props);
  const attributes = scope
    ? { 'data-hl-scope': scope.id, 'data-hl-scope-def': JSON.stringify(scope.def) }
    : {};
  return (
    <div {...root} {...attributes}>
      <SlotArea slot={props.content} />
      {scope && context.mode !== 'canvas' ? (
        <Island name="scope" markers={context.islands} props={{ id: scope.id }} />
      ) : null}
    </div>
  );
}
