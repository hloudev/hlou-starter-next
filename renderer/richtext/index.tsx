import { createElement, Fragment } from 'react';

import type { ReactNode } from 'react';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

type RichMark = { type: string; attrs?: Record<string, unknown> };

type RichNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  marks?: RichMark[];
  text?: string;
};

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRichNode(value: unknown): value is RichNode {
  return isRecord(value) && typeof value.type === 'string';
}

function readNodes(value: unknown): RichNode[] {
  return Array.isArray(value) ? value.filter(isRichNode) : [];
}

function readMarks(value: unknown): RichMark[] {
  return Array.isArray(value)
    ? value.filter((mark): mark is RichMark => isRecord(mark) && typeof mark.type === 'string')
    : [];
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readHeadingLevel(attrs: Record<string, unknown> | undefined): 1 | 2 | 3 {
  const level = attrs?.level;
  return level === 1 || level === 2 || level === 3 ? level : 3;
}

/** Only `http(s)`, `mailto`, `tel` and relative links survive into markup. */
function safeHref(value: unknown): string | undefined {
  const href = readString(value);
  if (!href) return undefined;
  if (/^(https?:|mailto:|tel:|\/|#|\.)/i.test(href)) return href;
  return undefined;
}

function wrapMarks(text: ReactNode, marks: RichMark[]): ReactNode {
  return marks.reduceRight<ReactNode>((child, mark) => {
    switch (mark.type) {
      case 'bold':
        return createElement('strong', null, child);
      case 'italic':
        return createElement('em', null, child);
      case 'code':
        return createElement('code', null, child);
      case 'link': {
        const href = safeHref(mark.attrs?.href);
        const target = readString(mark.attrs?.target);
        return href
          ? createElement(
              'a',
              { href, target, rel: target === '_blank' ? 'noopener noreferrer' : undefined },
              child
            )
          : child;
      }
      default:
        return child;
    }
  }, text);
}

function renderChildren(node: RichNode): ReactNode[] {
  return readNodes(node.content).map((child, index) => renderNode(child, index));
}

function renderNode(node: RichNode, key: number): ReactNode {
  switch (node.type) {
    case 'doc':
      return createElement(Fragment, { key }, ...renderChildren(node));
    case 'paragraph':
      return createElement('p', { key }, ...renderChildren(node));
    case 'heading':
      return createElement(`h${readHeadingLevel(node.attrs)}`, { key }, ...renderChildren(node));
    case 'bulletList':
      return createElement('ul', { key }, ...renderChildren(node));
    case 'orderedList':
      return createElement('ol', { key }, ...renderChildren(node));
    case 'listItem':
      return createElement('li', { key }, ...renderChildren(node));
    case 'blockquote':
      return createElement('blockquote', { key }, ...renderChildren(node));
    case 'hardBreak':
      return createElement('br', { key });
    case 'text':
      return createElement(Fragment, { key }, wrapMarks(node.text ?? '', readMarks(node.marks)));
    default:
      // Unknown node: keep the content, drop the wrapper.
      return createElement(Fragment, { key }, ...renderChildren(node));
  }
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * TipTap JSON → React, with no TipTap dependency. Recognises `doc`,
 * `paragraph`, `heading` (1–3), `bulletList`, `orderedList`, `listItem`,
 * `blockquote`, `hardBreak` and `text` with `bold` / `italic` / `code` / `link`
 * marks. Unknown nodes render their children; anything that is not a node
 * renders `null`.
 */
export function renderRichText(doc: unknown): ReactNode {
  if (!isRichNode(doc)) return null;
  return renderNode(doc, 0);
}

/** Plain-text projection of a TipTap doc, for `alt` text and summaries. */
export function richTextToPlain(doc: unknown): string {
  if (!isRichNode(doc)) return '';
  const walk = (node: RichNode): string => {
    if (node.type === 'text') return node.text ?? '';
    if (node.type === 'hardBreak') return '\n';
    const inner = readNodes(node.content).map(walk).join('');
    return node.type === 'paragraph' || node.type === 'heading' ? `${inner}\n` : inner;
  };
  return walk(doc).trim();
}
