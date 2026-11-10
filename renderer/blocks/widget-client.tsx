'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useSyncExternalStore } from 'react';

import type { CSSProperties, ReactElement } from 'react';
import type { ScopeSnapshot } from '../state/schema';

import { getScope } from '../state/store';

/* The island half of the scope widgets (quantity, choiceCards, steps,
   summary): types and hooks shared by their client components. Free of zod
   and of the contracts — the store it reads is the scope island's, already
   in the page's islands bundle. */

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** A styleable element's attributes, computed by the server shell (`blockParts`). */
export type WidgetStyled = {
  className: string;
  style?: CSSProperties;
  'data-hl-field'?: string;
  /** The element's motion, played by the page runtime. */
  'data-hl-motion'?: string;
};

/** An `<img>`'s attributes, computed by the server shell (`mediaImgAttrs`). */
export type WidgetImage = {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  alt: string;
  decoding: 'async';
  loading?: 'lazy';
  fetchPriority?: 'high';
};

/** The scope's errors and values as a widget reads them before hydration. */
export type WidgetSnapshot = Pick<ScopeSnapshot, 'values' | 'derived' | 'step' | 'errors'>;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

const subscribeNever = () => () => undefined;

/** The live store of scope `id`; none in the canvas (`''`) or outside a browser. */
function storeOf(id: string) {
  return id && typeof document !== 'undefined' ? getScope(id) : null;
}

/* -------------------------------------------------------------------------- */
/*                                    HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * The whole snapshot of scope `id`, live: `server` until hydration (and for
 * good in the canvas, where `id` is `''`), then the store's.
 */
export function useScopeSnapshot(id: string, server: WidgetSnapshot): WidgetSnapshot {
  const store = storeOf(id);
  return useSyncExternalStore(
    store ? store.subscribe : subscribeNever,
    () => (store ? store.get() : server),
    () => server
  );
}

/**
 * Whether the widget is live: `false` on the server and while hydrating (so
 * the first client render matches the server's disabled controls), then
 * `true` — never in the canvas, where the scope id is `''`.
 */
export function useLive(scope: string): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => scope !== '',
    () => false
  );
}

/** The error code `validate` wrote for field `key` (`required`, `chooseOne`…), or `''`. */
export function useScopeError(id: string, key: string): string {
  const store = storeOf(id);
  return useSyncExternalStore(
    store ? store.subscribe : subscribeNever,
    () => (store ? (store.get().errors[key] ?? '') : ''),
    () => ''
  );
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

/** An icon from its path data (256 box), in the current colour. */
export function WidgetIcon({ d, className }: { d: string[]; className: string }): ReactElement {
  return (
    <svg className={`shrink-0 fill-current ${className}`} viewBox="0 0 256 256" aria-hidden="true">
      {d.map((path, index) => (
        <path key={index} d={path} />
      ))}
    </svg>
  );
}

/** A scope error under a widget: the design's `WarningCircle` line. */
export function WidgetError({
  id,
  text,
  icon,
}: {
  id: string;
  text: string;
  icon: string[];
}): ReactElement {
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-site-xs text-site-error">
      <WidgetIcon d={icon} className="size-4" />
      {text}
    </p>
  );
}
