'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useCallback, useSyncExternalStore } from 'react';

import type { Action } from './schema';
import { getScope } from './store';

/* -------------------------------------------------------------------------- */
/*                                    HOOKS                                   */
/* -------------------------------------------------------------------------- */

const subscribeNever = () => () => undefined;

/**
 * One value of scope `id`, live, for a widget island (W3, W4) or the form
 * island (F3): the server's value until hydration, then the store's; and the
 * scope's `dispatch`. Outside a browser, or for a scope the page does not
 * hold, the value stays `serverValue` and dispatching does nothing.
 */
export function useScopeState<T>(
  id: string,
  path: string,
  serverValue: T
): [T, (action: Action) => void] {
  const store = typeof document === 'undefined' ? null : getScope(id);
  const value = useSyncExternalStore(
    store ? store.subscribe : subscribeNever,
    () => (store ? (store.read(path) as T) : serverValue),
    () => serverValue
  );
  const dispatch = useCallback((action: Action) => store?.dispatch(action), [store]);
  return [value, dispatch];
}
