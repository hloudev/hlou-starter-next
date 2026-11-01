import "server-only";

import raw from "@/site/snapshot.json";
import { siteSnapshotSchema, type SiteSnapshot } from "@/renderer";

/* -------------------------------------------------------------------------- */
/*                                  SNAPSHOT                                  */
/* -------------------------------------------------------------------------- */

let cached: SiteSnapshot | null = null;

/**
 * `site/snapshot.json`, validated once against the renderer's contract. A
 * malformed snapshot fails the build here, with a Zod message, rather than
 * somewhere inside a block. Everything read from it — routes, SEO, sitemap —
 * is the renderer's (`renderer/site`), so the kernel method reads it the same.
 */
export function getSnapshot(): SiteSnapshot {
  if (cached) return cached;
  const parsed = siteSnapshotSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `site/snapshot.json does not match the site-renderer contract:\n${parsed.error.message}`,
    );
  }
  cached = parsed.data;
  return cached;
}
