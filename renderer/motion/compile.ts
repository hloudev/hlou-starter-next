/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { MotionSpec } from './schema';
import { upgradeMotion } from './legacy';

/*
 * THE ATTRIBUTE (decision 319): blocks stay server components and carry
 * their motion as `data-hl-motion`, a compact JSON of the spec the page
 * runtime reads back. Compact means:
 *
 * - every key shortened through `MOTION_SHORT_KEYS` below (one table for
 *   every depth, so it stays a bijection: a key means the same thing
 *   wherever it appears — `f` is a `from`, be it a keyframe, a stagger
 *   origin or a range start);
 * - a key the spec does not know dropped, and any string longer than a spec
 *   value can be — the attribute carries stored props, which are untrusted;
 * - nothing empty (`{}`, `undefined`), but `enter`, `text` and `stagger`,
 *   which mean something empty;
 * - the defaults no preset changes dropped: `trigger: "inView"`,
 *   `once: true`, `media: "all"`. Anything a preset could override (a tween
 *   `type`, a `mirror: false`) is kept, since dropping it would let the
 *   preset win.
 *
 * ZOD-FREE, like `shared.tsx` that calls it: this ships in browser islands.
 * Validation is `read.ts`'s (`readMotionAttribute`, `readMotion`).
 */

/** Long key → short key. Values are never rewritten. */
export const MOTION_SHORT_KEYS = {
  /* Parts. */
  enter: 'e',
  hover: 'h',
  press: 'p',
  loop: 'l',
  scroll: 's',
  text: 't',
  stagger: 'g',
  transition: 'tr',
  media: 'm',
  /* Part fields. */
  preset: 'pr',
  from: 'f',
  to: 'o',
  trigger: 'tg',
  once: 'on',
  amount: 'a',
  margin: 'mg',
  keyframes: 'k',
  duration: 'd',
  repeatDelay: 'rd',
  mirror: 'mi',
  ranges: 'r',
  property: 'py',
  offset: 'of',
  split: 'sp',
  each: 'ea',
  /* Transition. */
  delay: 'dl',
  ease: 'es',
  type: 'ty',
  bounce: 'b',
  stiffness: 'sf',
  damping: 'dp',
  mass: 'ms',
  /* Keyframe. */
  opacity: 'op',
  x: 'x',
  y: 'y',
  scale: 'sc',
  rotate: 'ro',
  rotateX: 'rx',
  rotateY: 'ry',
  blur: 'bl',
  clip: 'c',
  side: 'sd',
} as const;

const SHORT: Readonly<Record<string, string>> = MOTION_SHORT_KEYS;
const LONG: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(MOTION_SHORT_KEYS).map(([long, short]) => [short, long])
);

/** Key/value pairs that equal what `resolveMotion` assumes, whatever the preset. */
const DEFAULTS: ReadonlyArray<readonly [string, unknown]> = [
  ['trigger', 'inView'],
  ['once', true],
  ['media', 'all'],
];

/* Parts that mean something left empty: `enter: {}` fades in, `text: {}`
   cascades its words, `stagger: {}` staggers by the default step. */
const KEEP_EMPTY = new Set(['enter', 'text', 'stagger']);

/** Longer than any value of the spec (`"0px 0px -10% 0px"`, `"center center"`). */
const MAX_STRING = 32;
const MAX_ITEMS = 8;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function compact(value: unknown, top = false): unknown {
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ITEMS).flatMap((item) => {
      const next = compact(item);
      return next === undefined ? [] : [next];
    });
  }
  if (typeof value === 'string') return value.length <= MAX_STRING ? value : undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean') return value;
  if (!isRecord(value)) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    const short = SHORT[key];
    if (short === undefined || child === undefined) continue;
    if (DEFAULTS.some(([name, fallback]) => name === key && fallback === child)) continue;
    const next = compact(child);
    if (next === undefined) continue;
    if (isRecord(next) && Object.keys(next).length === 0 && !(top && KEEP_EMPTY.has(key))) {
      continue;
    }
    out[short] = next;
  }
  return out;
}

/** The attribute's object back to the spec's keys. Not validated: see `readMotionAttribute`. */
export function expandMotion(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(expandMotion);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [LONG[key] ?? key, expandMotion(child)])
  );
}

/**
 * A motion — a spec, or a stored `style.motion` in either shape (the old one
 * upgrades first) — → the `data-hl-motion` value, or `undefined` when nothing
 * would move.
 */
export function motionAttribute(motion: MotionSpec | unknown): string | undefined {
  if (!isRecord(motion)) return undefined;
  const out = compact(upgradeMotion(motion), true);
  if (!isRecord(out) || Object.keys(out).length === 0) return undefined;
  /* Only `media` or a bare `transition` left: nothing to play. */
  const parts = Object.keys(out).filter(
    (key) => key !== MOTION_SHORT_KEYS.media && key !== MOTION_SHORT_KEYS.transition
  );
  if (parts.length === 0) return undefined;
  return JSON.stringify(out);
}

/** A `data-hl-motion` value → the spec's keys, unvalidated; `null` when it is not JSON. */
export function parseMotionAttribute(attribute: string | null | undefined): unknown {
  if (!attribute) return null;
  try {
    return expandMotion(JSON.parse(attribute));
  } catch {
    return null;
  }
}

/** Whether a stored style record carries motion that would play. */
function styleHasMotion(style: unknown): boolean {
  return isRecord(style) && motionAttribute(style.motion) !== undefined;
}

/**
 * Whether a page — its document, and the components it draws (header,
 * footer…) — carries any motion: a `style` (a block's, an item's) or an
 * `elements.<name>` entry with a motion that plays. `SiteRender` renders the
 * runtime island only then (MO2). Walks anything, like `siteStyleClasses`.
 */
export function hasMotion(
  doc: unknown,
  components: ReadonlyArray<{ doc?: unknown }> = []
): boolean {
  const visit = (value: unknown, key: string | null): boolean => {
    if (Array.isArray(value)) return value.some((item) => visit(item, null));
    if (!isRecord(value)) return false;
    if (key === 'style' && styleHasMotion(value)) return true;
    if (key === 'elements' && Object.values(value).some(styleHasMotion)) return true;
    return Object.entries(value).some(([child, next]) => visit(next, child));
  };
  return visit(doc, null) || components.some((component) => visit(component.doc, null));
}
