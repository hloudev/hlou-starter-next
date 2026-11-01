import { SiteChrome } from "@/renderer";

/**
 * The renderer's chrome (`SiteChrome`: skip link, `main#main-content`) in the
 * starter's layout. An async server component on purpose: the RSC payload
 * keeps the shape it had before the chrome moved into the renderer.
 */
export default async function MainLayout({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return <SiteChrome locale={locale}>{children}</SiteChrome>;
}
