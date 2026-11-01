import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  formEndpointBase,
  pageJsonLd,
  pageMetadata,
  pathToSlug,
  resolveRoute,
  siteRoutes,
  SiteRender,
  slugToPath,
} from "@/renderer";
import { siteEnv } from "@/lib/site";
import { getSnapshot } from "@/lib/snapshot";

/* -------------------------------------------------------------------------- */
/*                                   PARAMS                                   */
/* -------------------------------------------------------------------------- */

type Params = { locale: string; slug?: string[] };

/** Only what the snapshot lists is exported; nothing resolves at request time. */
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return siteRoutes(getSnapshot()).map((route) => ({
    locale: route.locale,
    slug: pathToSlug(route.path),
  }));
}

/* -------------------------------------------------------------------------- */
/*                                  METADATA                                  */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const snapshot = getSnapshot();
  const route = resolveRoute(snapshot, slugToPath(slug));
  if (!route) return {};
  return pageMetadata(snapshot, siteEnv, locale, route);
}

/* -------------------------------------------------------------------------- */
/*                                    PAGE                                    */
/* -------------------------------------------------------------------------- */

/**
 * Every page of the site: a static page, or a `collection_template` page with
 * the record its `[slug]` names. The composition is rendered by the vendored
 * renderer — header and footer come from the site composition, blocks are
 * styled by `renderer/styles/site.css` alone.
 */
export default async function SitePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const snapshot = getSnapshot();
  const route = resolveRoute(snapshot, slugToPath(slug));
  if (!route) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: pageJsonLd(snapshot, siteEnv, locale, route),
        }}
      />
      <SiteRender
        snapshot={snapshot}
        page={route.page}
        locale={locale}
        mode="static"
        record={route.record}
        formEndpoint={formEndpointBase(siteEnv)}
        formBuildId={siteEnv.buildId}
        basePath={`/${locale}`}
      />
    </>
  );
}
