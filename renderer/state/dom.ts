/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { StateFormat } from './schema';
import type { ScopeStore } from './store';
import { formatState } from './format';
import { findScope, getScope, parseAction } from './store';
import { parseJson as json } from './values';
import { evaluateWhen } from './when';

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

export const SCOPE_ATTRIBUTE = 'data-hl-scope';
export const SCOPE_DEF_ATTRIBUTE = 'data-hl-scope-def';
export const ACTION_ATTRIBUTE = 'data-hl-action';
export const BIND_ATTRIBUTE = 'data-hl-bind';
const WHEN_ATTRIBUTE = 'data-hl-when';
const OFF_ATTRIBUTE = 'data-hl-off';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

type Runtime = { listening: boolean; running: Map<string, () => void> };

function runtime(): Runtime {
  const holder = globalThis as { __hlScopeRuntime?: Runtime };
  return (holder.__hlScopeRuntime ??= { listening: false, running: new Map() });
}

/** The scope element of `id` on the page. */
export function scopeElement(id: string): HTMLElement | null {
  return findScope(id) ?? null;
}

/** One delegated listener for every scope: a click on `[data-hl-action]` dispatches to its scope. */
function onClick(event: Event): void {
  const target = event.target as Element | null;
  const trigger = target?.closest?.(`[${ACTION_ATTRIBUTE}]`);
  if (!trigger) return;
  const id = trigger.closest(`[${SCOPE_ATTRIBUTE}]`)?.getAttribute(SCOPE_ATTRIBUTE);
  const store = id ? getScope(id) : null;
  const action = parseAction(json(trigger.getAttribute(ACTION_ATTRIBUTE)));
  if (!store || !action) return;
  event.preventDefault();
  store.dispatch(action);
}

/**
 * The scope's server-drawn markup, brought to the store's state: each bound
 * text re-formatted, each `when` re-evaluated. Only attributes and text the
 * server shell owns — never markup React renders.
 */
function patch(element: HTMLElement, store: ScopeStore): void {
  const snapshot = store.get();
  for (const bound of element.querySelectorAll<HTMLElement>(`[${BIND_ATTRIBUTE}]`)) {
    const bind = json(bound.getAttribute(BIND_ATTRIBUTE)) as { p?: unknown; f?: unknown } | null;
    if (!bind || typeof bind.p !== 'string') continue;
    const locale = bound.closest('[lang]')?.getAttribute('lang') ?? 'fr';
    const text = formatState(store.read(bind.p), bind.f as StateFormat | undefined, {
      locale,
      currency: store.def.currency,
    });
    if (bound.textContent !== text) bound.textContent = text;
  }
  for (const gated of element.querySelectorAll<HTMLElement>(`[${WHEN_ATTRIBUTE}]`)) {
    const on = evaluateWhen(json(gated.getAttribute(WHEN_ATTRIBUTE)), snapshot);
    if (on === gated.hasAttribute(OFF_ATTRIBUTE)) gated.toggleAttribute(OFF_ATTRIBUTE, !on);
  }
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Starts scope `id` on this page: its store (`getScope`
 * builds it from `data-hl-scope-def`, sessionStorage and the URL), the one
 * delegated click listener on `document` (installed once, whatever the
 * number of scopes), and one subscriber that keeps the scope's bound texts
 * and `when` nodes current. Idempotent; returns the stop.
 */
export function startScopeRuntime(id: string): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const state = runtime();
  const running = state.running.get(id);
  if (running) return running;
  const element = scopeElement(id);
  const store = getScope(id);
  if (!element || !store) return () => undefined;
  if (!state.listening) {
    document.addEventListener('click', onClick);
    state.listening = true;
  }
  /* The first state may differ from the server's (storage, the URL). */
  patch(element, store);
  const unsubscribe = store.subscribe(() => patch(element, store));
  const stop = () => {
    unsubscribe();
    state.running.delete(id);
  };
  state.running.set(id, stop);
  return stop;
}

/** Stops every scope and the listener (tests). */
export function stopScopeRuntimes(): void {
  const state = runtime();
  for (const stop of [...state.running.values()]) stop();
  if (state.listening && typeof document !== 'undefined') {
    document.removeEventListener('click', onClick);
  }
  state.listening = false;
}
