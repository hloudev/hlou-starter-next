'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useEffect, useRef } from 'react';

import type { ReactElement } from 'react';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type TabsClientProps = {
  /** How many tabs the server drew. */
  count: number;
  /** The canvas: drawn, never wired. */
  inert: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Wires the tabs block's server markup (`root` is its `[data-hl-block]`):
 * click and arrow keys select (automatic activation — every panel is already
 * in the page), roving `tabindex`, Home / End, ← / → swapped in RTL, and a
 * find-in-page match in a hidden panel selects its tab (`beforematch`). Only
 * attributes change. Returns the cleanup.
 */
export function wireTabs(root: HTMLElement, count = Infinity): () => void {
  const list = root.querySelector<HTMLElement>('[role="tablist"]');
  if (!list) return () => undefined;
  const tabs = Array.from(list.querySelectorAll<HTMLElement>(':scope > [role="tab"]')).slice(
    0,
    count
  );
  const panels = tabs.map((tab) =>
    root.ownerDocument.getElementById(tab.getAttribute('aria-controls') ?? '')
  );
  const off: Array<() => void> = [];
  const on = <K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    fn: (event: HTMLElementEventMap[K]) => void
  ) => {
    target.addEventListener(type, fn);
    off.push(() => target.removeEventListener(type, fn));
  };

  const select = (index: number, focus: boolean) => {
    tabs.forEach((tab, at) => {
      const selected = at === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      /* React only knows `hidden` as a boolean: the upgrade happens here. */
      if (selected) panels[at]?.removeAttribute('hidden');
      else panels[at]?.setAttribute('hidden', 'until-found');
    });
    const tab = tabs[index];
    if (!tab) return;
    if (focus) tab.focus();
    tab.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  };

  panels.forEach((panel, index) => {
    if (!panel) return;
    if (panel.hidden) panel.setAttribute('hidden', 'until-found');
    on(panel, 'beforematch' as keyof HTMLElementEventMap, () => select(index, false));
  });

  on(list, 'click', (event) => {
    const index = tabs.indexOf((event.target as Element).closest?.('[role="tab"]') as HTMLElement);
    if (index >= 0) select(index, false);
  });

  on(list, 'keydown', (event) => {
    const current = tabs.indexOf(event.target as HTMLElement);
    if (current < 0) return;
    const step = list.closest('[dir]')?.getAttribute('dir') === 'rtl' ? -1 : 1;
    const last = tabs.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? current + step
        : event.key === 'ArrowLeft'
          ? current - step
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    select(next < 0 ? last : next > last ? 0 : next, true);
  });

  return () => off.forEach((fn) => fn());
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * The tabs island: draws a hidden anchor and nothing else. After
 * hydration it finds its block and wires the server's markup — the panels
 * (other blocks) are never inside a React tree of its own.
 */
export function TabsClient({ count, inert }: TabsClientProps): ReactElement {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (inert) return;
    const root = anchor.current?.closest<HTMLElement>('[data-hl-block]');
    return root ? wireTabs(root, count) : undefined;
  }, [count, inert]);
  return <span ref={anchor} hidden />;
}
