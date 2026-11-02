/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement, ReactNode } from 'react';
import { chromeMessages } from './messages';

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** `<body>`'s classes on every document a site exports. */
export const SITE_BODY_CLASS = 'bg-site-paper text-site-ink antialiased';

/* -------------------------------------------------------------------------- */
/*                                 COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

/**
 * The chrome around every rendered page: a skip link and the
 * `main#main-content` landmark. Header and footer are site-composition blocks
 * rendered by `SiteRender`, not React components here.
 */
export function SiteChrome({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="focus:bg-site-ink focus:text-site-paper sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-4 focus:inline-block focus:rounded-[var(--site-radius)] focus:px-4 focus:py-2 focus:text-sm focus:outline-none"
      >
        {chromeMessages(locale).skipToContent}
      </a>
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

/**
 * A redirect stub's forward: its `data-to` plus the visitor's query
 * and hash, which a meta refresh drops — a pasted `/reservation?from=…` keeps
 * its dates. One fixed text on every stub, so a future CSP allows it by one
 * `'sha256-…'`; only a same-origin path is followed.
 */
export const REDIRECT_SCRIPT = String.raw`(function(){var s=document.currentScript,t=s&&s.getAttribute('data-to');if(t&&/^\/(?![\/\\])/.test(t))location.replace(t+location.search+location.hash)})()`;

/**
 * A static redirect's body (`redirectStubs`), the same in both builders:
 * `REDIRECT_SCRIPT`; a `<meta http-equiv="refresh">` inside `<noscript>`, so
 * it never races the script and still forwards with JavaScript off; and a
 * visible link for anything that follows neither.
 */
export function RedirectBody({ locale, href }: { locale: string; href: string }): ReactElement {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center p-8">
      <script data-to={href} dangerouslySetInnerHTML={{ __html: REDIRECT_SCRIPT }} />
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${href}`} />
      </noscript>
      <a href={href} className="underline underline-offset-4">
        {chromeMessages(locale).redirecting.replace('{locale}', locale)}
      </a>
    </main>
  );
}

/** `404.html`'s body, in the default locale. */
export function NotFoundBody({ locale }: { locale: string }): ReactElement {
  const t = chromeMessages(locale);
  return (
    <main id="main-content" className="flex min-h-screen items-center py-16">
      <div className="max-w-site-content mx-auto px-5 md:px-10">
        <p className="text-site-xs text-site-ink-soft tracking-[0.14em] uppercase">404</p>
        <h1 className="text-site-xl mt-3 leading-tight">{t.notFoundTitle}</h1>
        <p className="text-site-ink-soft mt-3 max-w-prose">{t.notFoundBody}</p>
        <a
          href={`/${locale}/`}
          className="rounded-site-pill border-site-accent bg-site-accent text-site-on-accent mt-8 inline-flex min-h-11 items-center border px-6 text-sm font-medium hover:opacity-90"
        >
          {t.backHome}
        </a>
      </div>
    </main>
  );
}
