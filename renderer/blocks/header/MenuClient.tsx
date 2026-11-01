'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useEffect, useRef } from 'react';

import type { ReactElement } from 'react';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type MenuClientProps = {
  /** The canvas: drawn, never wired. */
  inert: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const FOCUSABLE = 'a[href],button:not([disabled])';
/** How far the page scrolls before an overlay header takes its paper. */
const SCROLLED_PX = 8;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Wires the header's server markup (`root` is its `[data-hl-block]`, M40-11).
 * The panels open and close natively (popovers); this adds what the browser
 * does not:
 *
 * - dropdowns: the caret toggles (touch has no hover) and syncs
 *   `aria-expanded`; ↓ opens and focuses the first child; Esc closes and
 *   focuses the caret; a click outside or opening another closes it;
 * - the panel: focus to its first link on open, Tab wraps in the full-screen
 *   menu, a same-page link hides it, focus back to the burger on hide;
 * - an overlay header that sticks takes the paper past 8 px of scroll;
 * - leaving the page shuts the panel and the dropdowns: Back (or a swipe)
 *   restores the page from the back/forward cache as it was left, menu open
 *   over the content.
 *
 * Returns the cleanup.
 */
export function wireMenu(root: HTMLElement): () => void {
  const doc = root.ownerDocument;
  const win = doc.defaultView ?? window;
  const off: Array<() => void> = [];
  const on = (
    target: EventTarget,
    type: string,
    fn: (event: Event) => void,
    options?: AddEventListenerOptions
  ) => {
    target.addEventListener(type, fn, options);
    off.push(() => target.removeEventListener(type, fn, options));
  };

  /* ------------------------------ Dropdowns ------------------------------ */

  const items = Array.from(root.querySelectorAll<HTMLElement>('.hl-menu__item'));
  const caretOf = (li: HTMLElement) => li.querySelector<HTMLElement>('.hl-menu__caret');
  const setOpen = (li: HTMLElement, open: boolean) => {
    li.toggleAttribute('data-open', open);
    /* Dismissed: shut even under the pointer or the focus, until they leave. */
    li.toggleAttribute('data-dismissed', !open);
    caretOf(li)?.setAttribute('aria-expanded', String(open));
  };
  const closeOthers = (keep?: HTMLElement) =>
    items.forEach((li) => {
      if (li !== keep && li.hasAttribute('data-open')) setOpen(li, false);
    });

  for (const li of items) {
    const caret = caretOf(li);
    if (!caret) continue;
    on(caret, 'click', () => {
      const open = !li.hasAttribute('data-open');
      closeOthers(li);
      setOpen(li, open);
    });
    on(li, 'keydown', (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === 'Escape' && (li.hasAttribute('data-open') || li.matches(':focus-within'))) {
        event.preventDefault();
        setOpen(li, false);
        caret.focus();
      } else if (key === 'ArrowDown' && event.target === caret) {
        event.preventDefault();
        closeOthers(li);
        setOpen(li, true);
        li.querySelector<HTMLElement>('.hl-menu__sub a')?.focus();
      }
    });
    /* Leaving clears a dismissal: hover and focus show it again next time. */
    on(li, 'pointerleave', () => li.removeAttribute('data-dismissed'));
    on(li, 'focusout', (event) => {
      const next = (event as FocusEvent).relatedTarget as Node | null;
      if (next && li.contains(next)) return;
      if (li.hasAttribute('data-open')) setOpen(li, false);
      li.removeAttribute('data-dismissed');
    });
  }
  if (items.length > 0) {
    on(doc, 'click', (event) => {
      const target = event.target as Node | null;
      items.forEach((li) => {
        if (li.hasAttribute('data-open') && !(target && li.contains(target))) setOpen(li, false);
      });
    });
  }

  /* -------------------------------- Panel -------------------------------- */

  const panel = root.querySelector<HTMLElement>('.hl-menu[popover]');
  const burger = panel
    ? root.querySelector<HTMLElement>(`[popovertarget="${panel.id}"]:not([popovertargetaction])`)
    : null;
  if (panel) {
    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    on(panel, 'toggle', (event) => {
      if ((event as ToggleEvent).newState === 'open') {
        (panel.querySelector<HTMLElement>('nav a[href]') ?? focusables()[0])?.focus();
      } else if (
        !doc.activeElement ||
        doc.activeElement === doc.body ||
        panel.contains(doc.activeElement)
      ) {
        burger?.focus();
      }
    });
    on(panel, 'click', (event) => {
      const link = (event.target as Element | null)?.closest?.(
        'a[href]'
      ) as HTMLAnchorElement | null;
      if (!link) return;
      const here = win.location;
      if (link.hash && link.pathname === here.pathname && link.search === here.search) {
        panel.hidePopover?.();
      }
    });
    if (panel.classList.contains('hl-menu--fullscreen')) {
      on(panel, 'keydown', (event) => {
        const key = event as KeyboardEvent;
        if (key.key !== 'Tab') return;
        const list = focusables();
        const first = list[0];
        const last = list[list.length - 1];
        if (!first || !last) return;
        if (key.shiftKey && doc.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!key.shiftKey && doc.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
    }
  }

  /* ------------------------------- Leaving ------------------------------- */

  const shut = () => {
    closeOthers();
    try {
      panel?.hidePopover?.();
    } catch {
      /* Already hidden: older engines throw where newer ones do nothing. */
    }
  };
  on(win, 'pagehide', shut);
  /* A page cached before this ran, or an engine that kept the panel open. */
  on(win, 'pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted) shut();
  });

  /* ------------------------------- Overlay ------------------------------- */

  if (root.classList.contains('hl-header--overlay') && root.classList.contains('fixed')) {
    const update = () => root.toggleAttribute('data-hl-scrolled', win.scrollY > SCROLLED_PX);
    on(win, 'scroll', update, { passive: true });
    update();
    off.push(() => root.removeAttribute('data-hl-scrolled'));
  }

  return () => off.forEach((fn) => fn());
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * The header's menu island (M40-11): a hidden anchor. After hydration it
 * finds its block and wires the server's markup; in the canvas it attaches
 * nothing.
 */
export function MenuClient({ inert }: MenuClientProps): ReactElement {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (inert) return;
    const root = anchor.current?.closest<HTMLElement>('[data-hl-block]');
    return root ? wireMenu(root) : undefined;
  }, [inert]);
  return <span ref={anchor} hidden />;
}
