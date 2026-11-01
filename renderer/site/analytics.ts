/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { SiteEnv } from './env';
import type { HeadTag } from './head';

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Whatever counter this build was given, or nothing at all — deferred
 * scripts. Both are cookieless and neither needs a consent banner, which is
 * why they render unconditionally when configured. Both can be present: a
 * client who already runs Plausible keeps it, and Hlou's own reporting reads
 * Cloudflare.
 */
export function analyticsTags(env: SiteEnv): HeadTag[] {
  const tags: HeadTag[] = [];
  if (env.plausibleDomain) {
    tags.push({
      tag: 'script',
      attrs: {
        defer: '',
        'data-domain': env.plausibleDomain,
        src: 'https://plausible.io/js/script.js',
      },
    });
  }
  if (env.cfBeaconToken) {
    tags.push({
      tag: 'script',
      attrs: {
        defer: '',
        'data-cf-beacon': JSON.stringify({ token: env.cfBeaconToken }),
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
      },
    });
  }
  return tags;
}
