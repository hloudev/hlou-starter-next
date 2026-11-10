/*
 * OUR OWN TEXT SPLITTER (M47, decision 319 — Motion+'s `splitText` is never
 * used). It cuts an element's text into pieces the runtime can animate one
 * after another: words, characters, or lines.
 *
 * - Only text nodes are cut, so inline marks (`<strong>`, `<a>`, `<em>`) and
 *   the element's structure stay exactly where they were.
 * - Each text node becomes a visually-hidden copy of itself (what assistive
 *   technology reads, and what a link inside keeps as its name) followed by
 *   an `aria-hidden` group of `<span class="hl-split">` pieces.
 * - Words keep the whitespace between them as plain text, so the text wraps
 *   as before. Characters sit inside a non-breaking word wrapper, so a word
 *   never breaks in the middle. Lines are the words, grouped by `offsetTop`.
 * - Cursive scripts (Arabic and its family) cannot be cut into characters
 *   without breaking the joins: their words stay whole when `chars` is asked.
 * - Idempotent: splitting a split element the same way returns the same
 *   split; another way reverts first. `revert()` restores the very text
 *   nodes it took out — a framework holding them (React, in the canvas)
 *   finds them again.
 *
 * DOM only, no dependency: it ships in the `motion` island.
 */

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type SplitBy = 'words' | 'chars' | 'lines';

export type SplitText = {
  by: SplitBy;
  /** What to animate, in reading order: the word or character spans. */
  pieces: HTMLElement[];
  /** The pieces grouped by visual line (`lines`); one group per piece otherwise. */
  lines: HTMLElement[][];
  /** Each piece's line, by piece index: the stagger step of `lines`. */
  lineOf: number[];
  /** Puts the original text nodes back. Safe to call twice. */
  revert: () => void;
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** Every piece's class. */
export const SPLIT_CLASS = 'hl-split';
/** The visually-hidden copy of a text node. */
export const SPLIT_SR_CLASS = 'hl-split-sr';
/** The `aria-hidden` group holding one text node's pieces. */
export const SPLIT_GROUP_CLASS = 'hl-split-group';

/* Inline, so a split never depends on a stylesheet being there (custom code,
   a canvas frame): a transform needs a box, a hidden copy needs no room. */
const PIECE_STYLE = 'display:inline-block';
const WORD_STYLE = 'display:inline-block;white-space:nowrap';
const SR_STYLE =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap';

/** Scripts whose letters join: cut into characters, they lose their shapes. */
const CURSIVE = /[\p{Script=Arabic}\p{Script=Syriac}\p{Script=Nko}\p{Script=Mongolian}]/u;
/** Where text is not prose. */
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'SELECT', 'OPTION', 'svg', 'SVG']);

const splits = new WeakMap<Element, SplitText>();

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function graphemes(text: string): string[] {
  const Segmenter = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (!Segmenter) return Array.from(text);
  return Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(text)).map(
    (part) => part.segment
  );
}

function span(doc: Document, className: string, style: string, text?: string): HTMLElement {
  const element = doc.createElement('span');
  element.className = className;
  element.setAttribute('style', style);
  if (text !== undefined) element.textContent = text;
  return element;
}

/** The text nodes worth cutting, in document order. */
function textNodes(host: Element): Text[] {
  const doc = host.ownerDocument;
  const walker = doc.createTreeWalker(host, 4 /* NodeFilter.SHOW_TEXT */);
  const out: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    if (!text.data.trim()) continue;
    let parent = text.parentElement;
    let skip = false;
    while (parent && parent !== host) {
      if (
        SKIP.has(parent.tagName) ||
        parent.classList.contains(SPLIT_SR_CLASS) ||
        parent.classList.contains(SPLIT_GROUP_CLASS)
      ) {
        skip = true;
        break;
      }
      parent = parent.parentElement;
    }
    if (!skip) out.push(text);
  }
  return out;
}

/** One text node → its pieces inside a group, beside a hidden copy. */
function cutText(
  doc: Document,
  text: string,
  by: SplitBy
): { group: HTMLElement; pieces: HTMLElement[] } {
  const group = doc.createElement('span');
  group.className = SPLIT_GROUP_CLASS;
  group.setAttribute('aria-hidden', 'true');
  const pieces: HTMLElement[] = [];
  for (const token of text.split(/(\s+)/)) {
    if (!token) continue;
    if (/^\s+$/.test(token)) {
      group.append(doc.createTextNode(token));
      continue;
    }
    if (by !== 'chars' || CURSIVE.test(token)) {
      const word = span(doc, `${SPLIT_CLASS} ${SPLIT_CLASS}--word`, PIECE_STYLE, token);
      pieces.push(word);
      group.append(word);
      continue;
    }
    const word = span(doc, `${SPLIT_CLASS}-word`, WORD_STYLE);
    for (const char of graphemes(token)) {
      const piece = span(doc, `${SPLIT_CLASS} ${SPLIT_CLASS}--char`, PIECE_STYLE, char);
      pieces.push(piece);
      word.append(piece);
    }
    group.append(word);
  }
  return { group, pieces };
}

/** Pieces → visual lines: a new line wherever a piece sits lower than the last. */
function groupLines(pieces: HTMLElement[]): HTMLElement[][] {
  const lines: HTMLElement[][] = [];
  let top = Number.NEGATIVE_INFINITY;
  for (const piece of pieces) {
    const next = piece.offsetTop;
    const current = lines.at(-1);
    /* Half a piece's height of tolerance: a superscript is not a line. */
    if (!current || next - top > Math.max(1, piece.offsetHeight / 2)) {
      lines.push([piece]);
      top = next;
    } else {
      current.push(piece);
    }
  }
  return lines;
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** The split an element currently carries, if any. */
export function currentSplit(host: Element): SplitText | undefined {
  return splits.get(host);
}

/**
 * Cuts `host`'s text into pieces (see the file's header). `lines` measures
 * the layout, so call it once the element is laid out (fonts loaded).
 */
export function splitText(host: HTMLElement, by: SplitBy): SplitText {
  const existing = splits.get(host);
  if (existing?.by === by) return existing;
  existing?.revert();

  const doc = host.ownerDocument;
  const taken: Array<{ original: Text; inserted: Node[] }> = [];
  const pieces: HTMLElement[] = [];
  for (const original of textNodes(host)) {
    const copy = span(doc, SPLIT_SR_CLASS, SR_STYLE, original.data);
    const { group, pieces: own } = cutText(doc, original.data, by);
    original.replaceWith(copy, group);
    taken.push({ original, inserted: [copy, group] });
    pieces.push(...own);
  }

  const lines = by === 'lines' ? groupLines(pieces) : pieces.map((piece) => [piece]);
  const lineOf = lines.flatMap((line, index) => line.map(() => index));

  let reverted = false;
  const split: SplitText = {
    by,
    pieces,
    lines,
    lineOf,
    revert: () => {
      if (reverted) return;
      reverted = true;
      for (const { original, inserted } of [...taken].reverse()) {
        const [first] = inserted;
        if (first?.parentNode) first.parentNode.insertBefore(original, first);
        for (const node of inserted) node.parentNode?.removeChild(node);
      }
      if (splits.get(host) === split) splits.delete(host);
    },
  };
  splits.set(host, split);
  return split;
}
