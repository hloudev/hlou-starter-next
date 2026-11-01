/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { SiteEnv } from './env';

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** The honeypot field a site form carries: rendered hidden, never sent filled. */
export const HONEYPOT_FIELD = 'website';

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * The endpoint prefix the form block posts to; the block appends the form
 * key. Empty — the form renders disabled — when the build names no project.
 *
 *   POST {apiUrl}/api/v1/public/forms/{projectId}/{formKey}
 */
export function formEndpointBase(env: SiteEnv): string {
  if (!env.projectId) return '';
  return `${env.apiUrl}/api/v1/public/forms/${env.projectId}/`;
}
