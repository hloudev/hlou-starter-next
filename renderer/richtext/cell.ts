/* -------------------------------------------------------------------------------
   A record's `richtext` cell is a string of HTML. A slot's rich text is a document,
   and a person translates its strings one by one, with its marks and links left to
   the source. This is the same treatment for a cell: its text runs out, and
   translations back onto the source's own tags.

   A scanner rather than a parser: the only question is which part is a tag, it runs on
   the server and in the browser, and it stays linear whatever a cell holds. Pure.
   ------------------------------------------------------------------------------- */

type Token =
  | { kind: 'text'; raw: string }
  | { kind: 'tag'; raw: string; name: string; closing: boolean; selfClosing: boolean }
  /* A comment, a doctype, or what a `<script>` or `<style>` holds: never words. */
  | { kind: 'other'; raw: string };

const RAW_TEXT_ELEMENTS = new Set(['script', 'style']);
const VOID_ELEMENTS = new Set(['br', 'hr', 'img', 'wbr', 'input', 'source', 'col', 'embed']);
const BLOCK_ELEMENTS = new Set([
  'p',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'section',
  'article',
  'pre',
  'table',
  'tr',
]);

/** Where the tag opening at `from` ends, past any `>` inside a quoted attribute. */
function tagEnd(html: string, from: number): number {
  let quote = '';
  for (let at = from; at < html.length; at += 1) {
    const char = html[at]!;
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '>') {
      return at;
    }
  }
  return -1;
}

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let at = 0;
  let textFrom = 0;
  const flush = (to: number) => {
    if (to > textFrom) tokens.push({ kind: 'text', raw: html.slice(textFrom, to) });
  };
  while (at < html.length) {
    const open = html.indexOf('<', at);
    if (open < 0) break;
    const next = html[open + 1] ?? '';

    if (html.startsWith('<!--', open) || next === '!' || next === '?') {
      const closer = html.startsWith('<!--', open) ? '-->' : '>';
      const end = html.indexOf(closer, open);
      const stop = end < 0 ? html.length : end + closer.length;
      flush(open);
      tokens.push({ kind: 'other', raw: html.slice(open, stop) });
      at = textFrom = stop;
      continue;
    }

    const closing = next === '/';
    const nameAt = open + (closing ? 2 : 1);
    /* « 2 < 3 » is text: a tag's name starts with a letter. */
    if (!/[a-zA-Z]/.test(html[nameAt] ?? '')) {
      at = open + 1;
      continue;
    }
    const end = tagEnd(html, nameAt);
    if (end < 0) break;

    let nameEnd = nameAt;
    while (nameEnd < end && !/[\s/]/.test(html[nameEnd]!)) nameEnd += 1;
    const name = html.slice(nameAt, nameEnd).toLowerCase();
    flush(open);
    tokens.push({
      kind: 'tag',
      raw: html.slice(open, end + 1),
      name,
      closing,
      selfClosing: html[end - 1] === '/' || VOID_ELEMENTS.has(name),
    });
    at = textFrom = end + 1;

    if (!closing && RAW_TEXT_ELEMENTS.has(name)) {
      const close = html.toLowerCase().indexOf(`</${name}`, at);
      const stop = close < 0 ? html.length : close;
      if (stop > at) tokens.push({ kind: 'other', raw: html.slice(at, stop) });
      at = textFrom = stop;
    }
  }
  flush(html.length);
  return tokens;
}

const hasTags = (tokens: readonly Token[]) => tokens.some((token) => token.kind !== 'text');

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
  mdash: '—',
  ndash: '–',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (whole, body: string) => {
    if (body.startsWith('#')) {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

const escapeText = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/**
 * A run as a person reads it. Inside markup a newline is only a space; a cell with no
 * tags at all is plain text someone typed, so it stays exactly as it was typed.
 */
function runText(raw: string, marked: boolean): string {
  if (!marked) return raw.trim();
  return decodeEntities(raw).replace(/\s+/g, ' ').trim();
}

const isRun = (token: Token) => token.kind === 'text' && token.raw.trim().length > 0;

/** A cell's text runs, in document order: the strings a person or a model translates. */
export function richCellSegments(html: string): string[] {
  const tokens = tokenize(html);
  const marked = hasTags(tokens);
  return tokens.filter(isRun).map((token) => runText(token.raw, marked));
}

/** A cell as text: blocks and `<br>` start a new line, a bold word stays in its sentence. */
export function richCellPlainText(html: string): string {
  const tokens = tokenize(html);
  const marked = hasTags(tokens);
  let out = '';
  for (const token of tokens) {
    if (token.kind === 'text') {
      if (!marked) {
        out += token.raw;
      } else {
        /* Spaces between words survive; the space a line break left around a tag doesn't. */
        out += decodeEntities(token.raw).replace(/\s+/g, ' ');
      }
    } else if (token.kind === 'tag' && (token.name === 'br' || BLOCK_ELEMENTS.has(token.name))) {
      out += '\n';
    }
  }
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

/** A translation with the original run's surrounding spaces, which join it to its tags. */
function keepEdges(raw: string, text: string, marked: boolean): string {
  const lead = /^\s*/.exec(raw)?.[0] ?? '';
  const trail = /\s*$/.exec(raw)?.[0] ?? '';
  const body = marked ? escapeText(text.trim()).replace(/\s*\n\s*/g, '<br>') : text.trim();
  return `${lead}${body}${trail}`;
}

/** Plain text with no structure to lean on: its own paragraphs, every character escaped. */
function paragraphsOf(text: string): string {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeText(line)}</p>`)
    .join('');
}

/**
 * What a translation's cell holds: the source's tags with these strings where its strings
 * were, so marks, links and paragraphs stay the source's and no typed `<` becomes markup.
 * A count that doesn't line up (one input over a misaligned value) has no structure to
 * follow, so it reads as paragraphs. All blank is empty, which clears the cell.
 */
export function richCellFromSegments(sourceHtml: string, segments: readonly string[]): string {
  if (segments.every((text) => !text.trim())) return '';
  const tokens = tokenize(sourceHtml);
  const marked = hasTags(tokens);
  const runs = tokens.filter(isRun).length;
  if (runs !== segments.length) {
    return marked ? paragraphsOf(segments.join('\n')) : segments.join('\n').trim();
  }
  let index = 0;
  return tokens
    .map((token) =>
      isRun(token) ? keepEdges(token.raw, segments[index++] ?? '', marked) : token.raw
    )
    .join('');
}

const skeletonOf = (tokens: readonly Token[]) =>
  tokens
    .filter((token) => token.kind !== 'text')
    .map((token) => token.raw)
    .join('');

/**
 * A stored translation read back into the source's runs, or null when it doesn't line up,
 * and the caller shows it in one input rather than losing text. The same tags mean each
 * run by where it sits, so a blank run stays blank instead of shifting the next one up.
 */
export function alignRichCell(sourceHtml: string, html: string): string[] | null {
  const source = tokenize(sourceHtml);
  const own = tokenize(html);
  const marked = hasTags(own);
  const count = source.filter(isRun).length;

  if (hasTags(source) && skeletonOf(source) === skeletonOf(own)) {
    const place = (tokens: readonly Token[]) => {
      let tags = 0;
      const out = new Map<number, Token>();
      for (const token of tokens) {
        if (token.kind !== 'text') tags += 1;
        else if (isRun(token)) out.set(tags, token);
      }
      return out;
    };
    const mine = place(own);
    return [...place(source).keys()].map((at) => {
      const token = mine.get(at);
      return token ? runText(token.raw, marked) : '';
    });
  }

  const runs = own.filter(isRun).map((token) => runText(token.raw, marked));
  return runs.length === count ? runs : null;
}

/* -------------------------------------------------------------------------- */
/*                               As a document                                */
/* -------------------------------------------------------------------------- */

interface DocMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface DocNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: DocMark[];
  text?: string;
}

const BLOCK_NODES: Readonly<Record<string, string>> = {
  p: 'paragraph',
  div: 'paragraph',
  ul: 'bulletList',
  ol: 'orderedList',
  li: 'listItem',
  blockquote: 'blockquote',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
};

const MARKS: Readonly<Record<string, string>> = {
  strong: 'bold',
  b: 'bold',
  em: 'italic',
  i: 'italic',
  u: 'underline',
  code: 'code',
  a: 'link',
};

function hrefOf(tag: string): string | undefined {
  const match = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
  const href = match?.[1] ?? match?.[2] ?? match?.[3];
  return href ? decodeEntities(href) : undefined;
}

const isInline = (node: DocNode) => node.type === 'text' || node.type === 'hardBreak';

/** Words directly in the document or a list, which a block has to hold to read as one. */
function wrapInline(nodes: readonly DocNode[]): DocNode[] {
  const out: DocNode[] = [];
  let open: DocNode | null = null;
  for (const node of nodes) {
    if (!isInline(node)) {
      open = null;
      out.push(node);
    } else if (open) {
      open.content!.push(node);
    } else if (node.type === 'text' && !node.text?.trim()) {
      continue;
    } else {
      open = { type: 'paragraph', content: [node] };
      out.push(open);
    }
  }
  return out;
}

/**
 * A cell as the TipTap document a slot's rich text already is, so one allow-listed walker
 * (`renderRichText`) draws both and nothing else reaches the page: an unknown tag leaves its
 * words behind, a `<script>`'s content is gone, an unsafe href is the walker's to drop.
 */
export function richCellDoc(html: string): DocNode {
  const tokens = tokenize(html);
  if (!hasTags(tokens)) {
    return {
      type: 'doc',
      content: html
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })),
    };
  }

  const root: DocNode = { type: 'doc', content: [] };
  const blocks: Array<{ name: string; node: DocNode }> = [{ name: '', node: root }];
  const marks: Array<{ name: string; mark: DocMark }> = [];
  const parent = () => blocks[blocks.length - 1]!.node;

  for (const token of tokens) {
    if (token.kind === 'other') continue;
    if (token.kind === 'text') {
      const text = decodeEntities(token.raw).replace(/\s+/g, ' ');
      if (!text.trim() && parent().type !== 'paragraph' && parent().type !== 'heading') continue;
      parent().content!.push({
        type: 'text',
        text,
        ...(marks.length > 0 ? { marks: marks.map((entry) => entry.mark) } : {}),
      });
      continue;
    }
    if (token.name === 'br') {
      if (!token.closing) parent().content!.push({ type: 'hardBreak' });
      continue;
    }
    const block = BLOCK_NODES[token.name];
    const mark = MARKS[token.name];
    if (block) {
      if (token.closing) {
        const at = blocks.map((entry) => entry.name).lastIndexOf(token.name);
        if (at > 0) blocks.length = at;
      } else if (!token.selfClosing) {
        const node: DocNode = {
          type: block,
          content: [],
          ...(block === 'heading' ? { attrs: { level: Number(token.name.slice(1)) } } : {}),
        };
        parent().content!.push(node);
        blocks.push({ name: token.name, node });
      }
    } else if (mark) {
      if (token.closing) {
        const at = marks.map((entry) => entry.name).lastIndexOf(token.name);
        if (at >= 0) marks.splice(at, 1);
      } else if (!token.selfClosing) {
        const href = mark === 'link' ? hrefOf(token.raw) : undefined;
        if (mark !== 'link' || href) {
          marks.push({
            name: token.name,
            mark: { type: mark, ...(href ? { attrs: { href } } : {}) },
          });
        }
      }
    }
  }

  const tidy = (node: DocNode): DocNode => {
    if (!node.content) return node;
    const content = node.content.map(tidy);
    return {
      ...node,
      content: node.type === 'doc' || node.type === 'blockquote' ? wrapInline(content) : content,
    };
  };
  return tidy(root);
}

/* -------------------------------------------------------------------------- */
/*                         Written by the rich editor                         */
/* -------------------------------------------------------------------------- */

/** The rich editor's own schema: what a slot's rich text holds. */
const EDITOR_HEADING_LEVELS = 2;

const isTextblock = (node: DocNode) => node.type === 'paragraph' || node.type === 'heading';

/** Every word and break under a node, for a text block that was handed blocks. */
function inlineOf(node: DocNode): DocNode[] {
  if (isInline(node)) return [node];
  return (node.content ?? []).flatMap(inlineOf);
}

function editorNode(node: DocNode): DocNode {
  if (isInline(node)) return node;
  if (isTextblock(node)) {
    const level = Number(node.attrs?.level);
    return {
      type: node.type,
      ...(node.type === 'heading'
        ? { attrs: { level: Math.min(Math.max(level || 1, 1), EDITOR_HEADING_LEVELS) } }
        : {}),
      content: (node.content ?? []).flatMap(inlineOf),
    };
  }
  if (node.type === 'bulletList' || node.type === 'orderedList') {
    return {
      type: 'bulletList',
      content: (node.content ?? []).map((child) =>
        editorNode(child.type === 'listItem' ? child : { type: 'listItem', content: [child] })
      ),
    };
  }
  /* `doc`, `blockquote` and `listItem` hold blocks: their loose words become a paragraph. */
  return { type: node.type, content: wrapInline((node.content ?? []).map(editorNode)) };
}

/**
 * A cell as the slot editor opens it: `richCellDoc` folded onto the editor's schema, whose
 * headings stop at two and whose lists are bullets. An `<ol>` or an `<h3>` someone pasted
 * keeps its words; only what the editor would refuse, and so open empty, changes.
 */
export function richCellEditorDoc(html: string): DocNode {
  const doc = editorNode(richCellDoc(html));
  /* A document holds a block at least: an empty cell opens on an empty line. */
  return doc.content?.length ? doc : { type: 'doc', content: [{ type: 'paragraph' }] };
}

/** The renderer's rule (`safeHref` in site-renderer): `http(s)`, `mailto`, `tel`, relative. */
const SAFE_HREF = /^(https?:|mailto:|tel:|\/|#|\.)/i;

const MARK_TAGS: Readonly<Record<string, string>> = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  code: 'code',
};

const BLOCK_TAGS: Readonly<Record<string, string>> = {
  paragraph: 'p',
  bulletList: 'ul',
  orderedList: 'ol',
  listItem: 'li',
  blockquote: 'blockquote',
};

function hasText(node: DocNode): boolean {
  if (node.type === 'text') return Boolean(node.text?.trim());
  return (node.content ?? []).some(hasText);
}

function textHtml(node: DocNode): string {
  return (node.marks ?? []).reduceRight(
    (inner, mark) => {
      if (mark.type === 'link') {
        const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : '';
        return SAFE_HREF.test(href)
          ? `<a href="${escapeText(href).replaceAll('"', '&quot;')}">${inner}</a>`
          : inner;
      }
      const tag = MARK_TAGS[mark.type];
      return tag ? `<${tag}>${inner}</${tag}>` : inner;
    },
    escapeText(node.text ?? '')
  );
}

function nodeHtml(node: DocNode): string {
  if (node.type === 'text') return textHtml(node);
  if (node.type === 'hardBreak') return '<br>';
  const inner = (node.content ?? []).map(nodeHtml).join('');
  if (node.type === 'heading') {
    const level = Math.min(Math.max(Number(node.attrs?.level) || 2, 1), 6);
    return `<h${level}>${inner}</h${level}>`;
  }
  const tag = BLOCK_TAGS[node.type];
  return tag ? `<${tag}>${inner}</${tag}>` : inner;
}

/**
 * What the rich editor's document stores in the cell: the HTML a cell has always held, in
 * the tags `richCellDoc` reads back and nothing else. Words are escaped, a link keeps its
 * href only where the renderer would draw it, and no other attribute is written, so what a
 * person types never becomes markup. No words is empty, which clears the cell; blank lines
 * at either end go, blank lines between paragraphs stay.
 */
export function richCellHtml(doc: unknown): string {
  const blocks = (doc as DocNode | null)?.content;
  if (!Array.isArray(blocks) || !blocks.some(hasText)) return '';
  /* One block has words, so neither end walks past it. */
  const blank = (node: DocNode | undefined) => node?.type === 'paragraph' && !hasText(node);
  let first = 0;
  let last = blocks.length - 1;
  while (blank(blocks[first])) first += 1;
  while (blank(blocks[last])) last -= 1;
  return blocks
    .slice(first, last + 1)
    .map(nodeHtml)
    .join('');
}
