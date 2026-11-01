// The chrome module alone: the root stub must not pull the renderer barrel.
import { RedirectBody } from "@/renderer/site/chrome";

/**
 * A static redirect: the renderer's `RedirectBody` — a fixed inline script
 * that forwards with the visitor's query and hash, a `<noscript>` meta
 * refresh for JavaScript off, and a visible link — the same markup the kernel
 * writes. `redirect()` in a static export produces an error shell that only
 * forwards once the client bundle runs; this works on any host. The list of
 * stubs is the renderer's `redirectStubs`. Async so the RSC payload keeps its
 * shape.
 */
export async function RedirectStub({
  locale,
  href,
}: {
  locale: string;
  href: string;
}) {
  return <RedirectBody locale={locale} href={href} />;
}
