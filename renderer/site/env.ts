/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/**
 * The build-time constants a site's chrome reads — every one public, since
 * each ships in the HTML. The renderer never reads `process.env` itself: each
 * method reads its own env file (`NEXT_PUBLIC_*` for Next, `PUBLIC_*` for the
 * kernel) and hands the values over through `createSiteEnv`.
 */
export type SiteEnv = {
  /** Canonical origin, no trailing slash. */
  siteUrl: string;
  /** The Hlou control plane the site posts forms to, no trailing slash. */
  apiUrl: string;
  /** The Hlou project the public endpoints are keyed by; empty disables forms. */
  projectId: string;
  /** Set to enable Plausible. */
  plausibleDomain: string;
  /** Cloudflare Web Analytics beacon token, written by the builder. */
  cfBeaconToken: string;
  /** The build row a preview's forms name (`X-Hlou-Build`); unset in production. */
  buildId?: string;
  /** A preview build is never indexed, whatever the settings say. */
  environment: SiteEnvironment;
  /**
   * The platform's verdict for this build: `false` closes the
   * site to search engines whatever its settings say — a dev or local
   * builder, or a site whose automatic default is off. Unset (a starter run
   * alone) leaves it to the site's own `indexable`.
   */
  indexable: boolean;
};

export type SiteEnvironment = 'production' | 'preview';

export type SiteEnvInput = { [K in keyof SiteEnv]?: string | undefined };

/**
 * Whether search engines may index this site: never a preview, never when
 * the platform closed the build (`env.indexable`), never when the site or
 * page says no. `robots.txt`, `<meta name=robots>` and `llms.txt` all ask
 * this one question.
 */
export function siteIsIndexable(env: SiteEnv, settings: { indexable?: boolean }): boolean {
  return env.environment !== 'preview' && env.indexable && settings.indexable !== false;
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

const trimSlash = (value: string) => value.replace(/\/$/, '');

/**
 * Defaults for a site run on its own (`pnpm dev` in a starter, no builder) —
 * production-shaped: only a build that says `preview` is one.
 */
export function createSiteEnv(input: SiteEnvInput): SiteEnv {
  return {
    siteUrl: trimSlash(input.siteUrl ?? 'http://localhost:4173'),
    apiUrl: trimSlash(input.apiUrl ?? 'http://localhost:3000'),
    projectId: input.projectId ?? '',
    plausibleDomain: input.plausibleDomain ?? '',
    cfBeaconToken: input.cfBeaconToken ?? '',
    environment: input.environment === 'preview' ? 'preview' : 'production',
    indexable: input.indexable !== 'false',
    ...(input.buildId ? { buildId: input.buildId } : {}),
  };
}

/** Absolute URL for a site-relative path. */
export function absoluteUrl(env: SiteEnv, path: string): string {
  return `${env.siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/** A URL as written when absolute, else resolved against the site (`/og.png` → `https://…/og.png`). */
export function resolveSiteUrl(env: SiteEnv, url: string): string {
  return /^https?:\/\//i.test(url) ? url : absoluteUrl(env, url);
}
