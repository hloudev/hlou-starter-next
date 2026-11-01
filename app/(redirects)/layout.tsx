import type { Metadata } from "next";
// The chrome module alone: the barrel would pull client blocks into the root chunk.
import { SITE_BODY_CLASS } from "@/renderer/site/chrome";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { getSnapshot } from "@/lib/snapshot";
import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  robots: { index: false, follow: true },
};

/**
 * Root layout of the redirect stubs (`/` and every unprefixed path), which
 * forward to the default locale. Kept minimal: the stub is `RedirectBody` —
 * but in the version's palette, so a slow redirect never flashes the other one.
 * Never indexed; `/` adds the home page's share tags (`page.tsx`).
 */
export default function RedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang={routing.defaultLocale}
      data-site-scheme={getSnapshot().colorScheme}
      suppressHydrationWarning
    >
      <body className={SITE_BODY_CLASS}>{children}</body>
    </html>
  );
}
