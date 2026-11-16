import { llmsTxt } from "@/renderer";
import { siteEnv } from "@/lib/site";
import { getSnapshot } from "@/lib/snapshot";

export const dynamic = "force-static";

/**
 * `llms.txt` (llmstxt.org): the site and its pages, for LLMs — the renderer's
 * (`llmsTxt`). A site closed to search engines has none: the route answers
 * 404 and the export writes no file.
 */
export function GET(): Response {
  const body = llmsTxt(getSnapshot(), siteEnv);
  if (body === null) return new Response(null, { status: 404 });
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
