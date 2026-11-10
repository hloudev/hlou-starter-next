import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  layoutMetadata,
  motionGuardScript,
  SITE_BODY_CLASS,
  SITE_SCHEME_SCRIPT,
  siteHtmlAttrs,
  siteViewport,
  themeMotion,
} from "@/renderer";
import MainLayout from "@/components/MainLayout";
import { isLocale, routing } from "@/i18n/routing";
import { Analytics } from "@/lib/analytics";
import { siteEnv } from "@/lib/site";
import { getSnapshot } from "@/lib/snapshot";
import "@/app/globals.css";

/* -------------------------------------------------------------------------- */
/*                                   PARAMS                                   */
/* -------------------------------------------------------------------------- */

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/* -------------------------------------------------------------------------- */
/*                                  METADATA                                  */
/* -------------------------------------------------------------------------- */

/** The renderer's layout metadata (`renderer/site/seo.ts`), handed to Next as is. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = layoutMetadata(getSnapshot(), siteEnv, locale);
  return { ...metadata, metadataBase: new URL(metadata.metadataBase) };
}

export function generateViewport(): Viewport {
  return siteViewport(getSnapshot());
}

/* -------------------------------------------------------------------------- */
/*                                   LAYOUT                                   */
/* -------------------------------------------------------------------------- */

/**
 * The root layout of every rendered page. It lives under `[locale]` (route
 * group `(site)`) so the static HTML carries `<html lang dir>` for the
 * page's own locale — a root `app/layout.tsx` cannot read the segment.
 *
 * Everything here is the renderer's chrome (`renderer/site`) — the kernel
 * build method writes the same document from the same functions.
 *
 * The theme (colours, fonts, radius) lands on `:root` via `themeToCss`, the
 * same function `SiteRoot` uses inside `.hl-site-scope` for the block tree —
 * one function, locale-aware, so the chrome outside the scope (this layout,
 * `MainLayout`, the skip link) and the blocks inside it always agree. Fonts
 * are no longer `next/font`-self-hosted: the theme can name any Google font
 * or an uploaded file, resolved at runtime by `SiteRoot`'s own `<link>`/
 * `<style>` injection, not a compile-time `next/font` call — self-hosting is
 * a deferred, separate optimisation (see `docs/site-pipeline.md`).
 *
 * Colour scheme: every theme colour is a `light-dark()` pair and
 * `.hl-site-root` gives `<html>` `color-scheme: light dark`, so the page
 * follows the visitor's system with no script. `SITE_SCHEME_SCRIPT` only
 * re-applies a choice the theme-toggle block remembered. A version frozen in
 * one palette (the Design / Preview switch, `snapshot.colorScheme`) arrives as
 * `html.scheme` and is baked on `<html>` as `data-site-scheme`; the builder
 * stamps it after the export too, and warns when this layout did not.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  const snapshot = getSnapshot();
  const html = siteHtmlAttrs(snapshot, locale);

  return (
    <html
      lang={html.lang}
      dir={html.dir}
      style={html.style as CSSProperties}
      className={html.className}
      data-site-scheme={html.scheme}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SITE_SCHEME_SCRIPT }} />
        {/* Motion's pre-paint guard (decision 321): what will appear is
            pre-hidden only once a runtime is coming, with a failsafe. */}
        <script
          dangerouslySetInnerHTML={{
            __html: motionGuardScript(themeMotion(snapshot.theme).reducedMotion),
          }}
        />
      </head>
      <body className={SITE_BODY_CLASS} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <MainLayout locale={locale}>{children}</MainLayout>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
