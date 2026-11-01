import { pathToSlug, redirectStubs, slugToPath } from "@/renderer";
import { routing } from "@/i18n/routing";
import { RedirectStub } from "@/components/RedirectStub";
import { getSnapshot } from "@/lib/snapshot";

/**
 * Unprefixed paths (`/rooms`, `/rooms/jasmin`) → the default locale: one stub
 * per entry of the renderer's `redirectStubs`, bar `/` (`../page.tsx`).
 */
export const dynamicParams = false;

/**
 * A site whose only page is `/` has no stub here, and a static export refuses
 * a route that generates nothing. It gets this one page instead, which sends
 * the visitor home like `/` does.
 */
const PLACEHOLDER = "_hlou";

export function generateStaticParams(): Array<{ slug: string[] }> {
  const params = redirectStubs(getSnapshot())
    .filter((stub) => stub.path !== "/")
    .map((stub) => ({ slug: pathToSlug(stub.path) }));
  return params.length > 0 ? params : [{ slug: [PLACEHOLDER] }];
}

export default async function UnprefixedPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = slugToPath(slug);
  const stub = redirectStubs(getSnapshot()).find((entry) => entry.path === path);
  if (!stub) {
    return (
      <RedirectStub
        locale={routing.defaultLocale}
        href={`/${routing.defaultLocale}/`}
      />
    );
  }
  return <RedirectStub locale={stub.locale} href={stub.to} />;
}
