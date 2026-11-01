/**
 * Posting a site form to the Hlou public endpoint.
 *
 * The renderer's form block (`renderer/blocks/form`) already does this on its
 * own with the `formEndpoint` the page passes to `SiteRender`. This module is
 * for the starter's own chrome (a newsletter field in a custom footer, a
 * bespoke contact form) so hand-written forms hit the same endpoint with the
 * same contract:
 *
 *   POST {NEXT_PUBLIC_HLOU_API_URL}/api/v1/public/forms/{projectId}/{formKey}
 *   { formKey, locale, data }
 *
 * The endpoint applies CORS for the project's domains, a honeypot and a rate
 * limit, validates `data` with the form's collection schema, and writes one
 * record + one message. The honeypot field is named `website`: render it
 * visually hidden, and never send when it is filled.
 */

import { formEndpointBase, HONEYPOT_FIELD } from "@/renderer";
import { siteEnv } from "@/lib/site";

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export { HONEYPOT_FIELD };

export type FormSubmission = {
  formKey: string;
  locale: string;
  data: Record<string, unknown>;
};

export type FormResult =
  | { ok: true }
  | {
      ok: false;
      code: "spam" | "network" | "rejected";
      status?: number;
      message?: string;
    };

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

export function formEndpoint(formKey: string): string {
  const base = formEndpointBase(siteEnv);
  return base ? `${base}${encodeURIComponent(formKey)}` : "";
}

/**
 * Collect a `<form>`'s fields into the submission payload. Drops the honeypot
 * and returns `null` when it was filled (a bot) — do not post in that case.
 */
export function collectForm(
  form: HTMLFormElement,
): Record<string, unknown> | null {
  const data = new FormData(form);
  const honeypot = data.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim() !== "") return null;
  const out: Record<string, unknown> = {};
  for (const [key, value] of data.entries()) {
    if (key === HONEYPOT_FIELD) continue;
    out[key] = typeof value === "string" ? value : value.name;
  }
  return out;
}

export async function submitForm(
  submission: FormSubmission,
): Promise<FormResult> {
  const endpoint = formEndpoint(submission.formKey);
  if (!endpoint)
    return {
      ok: false,
      code: "rejected",
      message: "No Hlou project configured",
    };
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });
    if (response.ok) return { ok: true };
    let message: string | undefined;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      message = body.error?.message;
    } catch {
      message = undefined;
    }
    return { ok: false, code: "rejected", status: response.status, message };
  } catch {
    return { ok: false, code: "network" };
  }
}
