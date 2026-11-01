/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/**
 * One element of a document's `<head>`, framework-free. The kernel serialises
 * these with `headTagsToHtml`; Next builds the same tags from `Metadata`.
 */
export type HeadTag =
  | { tag: 'meta' | 'link'; attrs: Record<string, string> }
  | { tag: 'title'; text: string }
  | { tag: 'script'; attrs: Record<string, string>; html?: string };

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** The escaping React applies to text and attribute values. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function attrsToHtml(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([name, value]) => (value === '' ? ` ${name}` : ` ${name}="${escapeHtml(value)}"`))
    .join('');
}

/** `<head>` children as HTML, void elements self-closed the way React writes them. */
export function headTagsToHtml(tags: readonly HeadTag[]): string {
  return tags
    .map((tag) => {
      if (tag.tag === 'title') return `<title>${escapeHtml(tag.text)}</title>`;
      if (tag.tag === 'script')
        return `<script${attrsToHtml(tag.attrs)}>${tag.html ?? ''}</script>`;
      return `<${tag.tag}${attrsToHtml(tag.attrs)}/>`;
    })
    .join('');
}

/** `<html>` attributes as HTML (`style` given as CSS variables). */
export function htmlAttrsToHtml(attrs: {
  lang: string;
  dir?: string;
  className?: string;
  style?: Record<string, string>;
  scheme?: string;
}): string {
  const out: Record<string, string> = { lang: attrs.lang };
  if (attrs.dir) out.dir = attrs.dir;
  if (attrs.style) {
    out.style = Object.entries(attrs.style)
      .map(([name, value]) => `${name}:${value}`)
      .join(';');
  }
  if (attrs.className) out.class = attrs.className;
  if (attrs.scheme) out['data-site-scheme'] = attrs.scheme;
  return attrsToHtml(out);
}
