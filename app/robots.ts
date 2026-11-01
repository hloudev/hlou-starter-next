import type { MetadataRoute } from "next";
import { robotsData } from "@/renderer";
import { siteEnv } from "@/lib/site";
import { getSnapshot } from "@/lib/snapshot";

export const dynamic = "force-static";

/** The renderer's rule (`robotsData`): closed on a preview build or a site set not to be indexed. */
export default function robots(): MetadataRoute.Robots {
  return robotsData(siteEnv, getSnapshot());
}
