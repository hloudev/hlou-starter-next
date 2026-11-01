import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/renderer";
import { siteEnv } from "@/lib/site";
import { getSnapshot } from "@/lib/snapshot";

export const dynamic = "force-static";

/** The renderer's entries (`sitemapEntries`): one per page × locale, every locale an alternate. */
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(getSnapshot(), siteEnv);
}
