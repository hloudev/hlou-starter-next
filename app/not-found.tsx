import type { Metadata } from "next";
// The chrome module alone: the barrel would pull client blocks into the root chunk.
import { NotFoundBody, SITE_BODY_CLASS } from "@/renderer/site/chrome";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { getSnapshot } from "@/lib/snapshot";
import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  robots: { index: false, follow: false },
};

/**
 * `404.html`. It sits outside both root layouts (route groups `(site)` and
 * `(redirects)`), so it renders its own document in the default locale. The
 * body is the renderer's (`NotFoundBody`), shared with the kernel; the
 * palette is the version's, like every other page.
 */
export default async function NotFound() {
  const locale = routing.defaultLocale;
  return (
    <html lang={locale} data-site-scheme={getSnapshot().colorScheme}>
      <body className={SITE_BODY_CLASS}>
        <NotFoundBody locale={locale} />
      </body>
    </html>
  );
}
