'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useEffect } from 'react';

import { startScopeRuntime } from '../../state/dom';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type ScopeRuntimeClientProps = {
  /** The scope's id: its node id, `<instance>/<node>` inside an instance. */
  id: string;
};

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * The scope island (decision 198): draws nothing and wraps nothing. After
 * hydration it starts the DOM runtime, which patches the server's markup —
 * so no React tree ever sits around the scope's blocks, and Next never sees
 * a mismatch.
 */
export function ScopeRuntimeClient({ id }: ScopeRuntimeClientProps): null {
  useEffect(() => startScopeRuntime(id), [id]);
  return null;
}
