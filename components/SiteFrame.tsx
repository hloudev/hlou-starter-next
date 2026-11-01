import type { ReactNode } from "react";
import { SiteRender } from "@/renderer";
import { getSnapshot } from "@/lib/snapshot";

/**
 * One site component (the Header or the Footer) exactly as Hlou draws it on a
 * page: the home page with every node removed except that component's
 * instance. Nothing renders when the site has no such component.
 */
async function SiteComponent({
  kind,
  locale,
}: {
  kind: "header" | "footer";
  locale: string;
}) {
  const snapshot = getSnapshot();
  const home = snapshot.pages.find((page) => page.path === "/");
  const component = snapshot.components.find((entry) => entry.kind === kind);
  if (!home || !component) return null;
  const { root } = home.doc;
  const nodes = Object.fromEntries(
    Object.entries(home.doc.nodes).filter(
      ([id, node]) => id === root || node.instanceOf === component.id,
    ),
  );
  return (
    <SiteRender
      snapshot={snapshot}
      page={{ ...home, doc: { ...home.doc, nodes } }}
      locale={locale}
      basePath={`/${locale}`}
    />
  );
}

/**
 * The site's Header and Footer around a page Hlou does not draw — an exported
 * site's own pages in `app/(custom)/` (see `custom/README.md`). Their content
 * stays Hlou's: they change in Design and Content, never here.
 */
export default async function SiteFrame({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteComponent kind="header" locale={locale} />
      {children}
      <SiteComponent kind="footer" locale={locale} />
    </>
  );
}
