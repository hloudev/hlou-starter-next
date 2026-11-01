'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useSyncExternalStore } from 'react';

import type { CSSProperties, ReactElement } from 'react';

import { SITE_SCHEME_ATTRIBUTE, SITE_SCHEME_STORAGE_KEY } from '../../theme/scheme';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type ThemeToggleClientProps = {
  label: string;
  /** The button's utilities, variant and designer style included (the shell
   *  resolves them server-side). */
  className: string;
  /** Inline variables of the button's own style. */
  style?: CSSProperties;
  /** On the Design canvas the scheme belongs to the toolbar: the button is
   *  drawn but never flips anything. */
  inert: boolean;
  field?: { 'data-hl-field'?: string };
};

type Scheme = 'light' | 'dark';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/** The palette actually showing: a forced `<html>` attribute, else the system. */
function currentScheme(): Scheme {
  const forced = document.documentElement.getAttribute(SITE_SCHEME_ATTRIBUTE);
  if (forced === 'light' || forced === 'dark') return forced;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Re-reads on a system switch and on any toggle flipping `<html>` — so two
 *  toggles on one page (header and footer) never disagree. */
function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  query.addEventListener('change', onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [SITE_SCHEME_ATTRIBUTE],
  });
  return () => {
    query.removeEventListener('change', onChange);
    observer.disconnect();
  };
}

const subscribeNever = () => () => undefined;

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * Flips the site between its two palettes by forcing `data-site-scheme` on
 * `<html>` (which `site.css` turns into `color-scheme`) and remembers the
 * choice; the starter's pre-paint `SITE_SCHEME_SCRIPT` re-applies it on the
 * next load. Which glyph shows is pure CSS off the same attribute and the
 * system preference, so the server render is already right — the store only
 * feeds `aria-pressed` once hydrated.
 */
export function ThemeToggleClient({
  label,
  className,
  style,
  inert,
  field,
}: ThemeToggleClientProps): ReactElement {
  /* `null` on the server and on the canvas: no `aria-pressed` until known. */
  const scheme = useSyncExternalStore<Scheme | null>(
    inert ? subscribeNever : subscribe,
    () => (inert ? null : currentScheme()),
    () => null
  );

  const toggle = () => {
    if (inert) return;
    const next: Scheme = currentScheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute(SITE_SCHEME_ATTRIBUTE, next);
    try {
      window.localStorage.setItem(SITE_SCHEME_STORAGE_KEY, next);
    } catch {
      /* Storage blocked (private window): the choice lasts for this page only. */
    }
  };

  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={label}
      aria-pressed={scheme === null ? undefined : scheme === 'dark'}
      title={label}
      onClick={toggle}
      {...field}
    >
      <svg className="hl-theme-toggle__moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      </svg>
      <svg className="hl-theme-toggle__sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.25" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
    </button>
  );
}
