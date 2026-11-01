/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { SiteSocial } from '../contracts';

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** Where a bare handle lives on each network; the app stores profile URLs, a handle is tolerated. */
const PROFILE_BASE: Record<keyof SiteSocial, string> = {
  x: 'https://x.com/',
  facebook: 'https://www.facebook.com/',
  instagram: 'https://www.instagram.com/',
  linkedin: 'https://www.linkedin.com/company/',
  youtube: 'https://www.youtube.com/@',
  tiktok: 'https://www.tiktok.com/@',
};

const NETWORKS = Object.keys(PROFILE_BASE) as (keyof SiteSocial)[];

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** A profile as an absolute URL: a URL as is, a handle (`@dar`, `dar`) on its network. */
export function socialProfileUrl(network: keyof SiteSocial, value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, '');
  return handle ? `${PROFILE_BASE[network]}${handle}` : undefined;
}

/** Every profile the site names, in a fixed order — JSON-LD's `sameAs`. */
export function socialProfileUrls(social: SiteSocial | undefined): string[] {
  if (!social) return [];
  return NETWORKS.flatMap((network) => {
    const value = social[network];
    const url = value ? socialProfileUrl(network, value) : undefined;
    return url ? [url] : [];
  });
}

/** `@handle` for `twitter:site`, from an X / Twitter profile URL or a handle. */
export function xHandle(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  let handle = trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      handle = new URL(trimmed).pathname.split('/').find(Boolean) ?? '';
    } catch {
      return undefined;
    }
  }
  handle = handle.replace(/^@/, '');
  return /^\w{1,15}$/.test(handle) ? `@${handle}` : undefined;
}
