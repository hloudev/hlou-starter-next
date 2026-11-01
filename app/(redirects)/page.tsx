import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { RedirectStub } from "@/components/RedirectStub";
import { siteEnv } from "@/lib/site";
import { getSnapshot } from "@/lib/snapshot";
// The seo module alone: the barrel would pull client blocks into the stub's chunk.
import { rootStubMetadata } from "@/renderer/site/seo";

/**
 * The bare domain is the URL people paste most, so its stub carries the home
 * page's title, description, Open Graph and X cards and the icons — the
 * renderer's `rootStubMetadata`, which the kernel writes as `rootStubHead`.
 * Never indexed: `og:url` names the home it forwards to.
 */
export function generateMetadata(): Metadata {
  const metadata = rootStubMetadata(getSnapshot(), siteEnv);
  return { ...metadata, metadataBase: new URL(metadata.metadataBase) };
}

/**
 * `/` → the default locale, query and hash kept (a `<noscript>` meta refresh
 * without JavaScript) — the first of the renderer's `redirectStubs`.
 */
export default function RootPage() {
  return (
    <RedirectStub
      locale={routing.defaultLocale}
      href={`/${routing.defaultLocale}/`}
    />
  );
}
