// The env module alone: the root layouts import this file, and the barrel
// would pull client blocks into the root chunk.
import { createSiteEnv } from "@/renderer/site/env";

/**
 * The build-time constants the site's chrome reads, from `NEXT_PUBLIC_*`
 * (written by the builder into `.env.local`). Every one ships in the HTML, so
 * every one is public. The chrome itself is the renderer's (`renderer/site`);
 * this is the one place the starter reads its env.
 */
export const siteEnv = createSiteEnv({
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  apiUrl: process.env.NEXT_PUBLIC_HLOU_API_URL,
  projectId: process.env.NEXT_PUBLIC_HLOU_PROJECT_ID,
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  cfBeaconToken: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN,
  /* The build row a preview's forms name (`X-Hlou-Build`); production sets none. */
  buildId: process.env.NEXT_PUBLIC_HLOU_BUILD_ID,
  /* `preview` builds are never indexed; unset (a starter run alone) is production. */
  environment: process.env.NEXT_PUBLIC_HLOU_ENVIRONMENT,
});

/** Canonical site origin (no trailing slash). */
export const siteUrl = siteEnv.siteUrl;
