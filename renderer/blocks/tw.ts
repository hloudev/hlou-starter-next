/* -------------------------------------------------------------------------- */
/*                                   PURPOSE                                  */
/* -------------------------------------------------------------------------- */

/**
 * The Tailwind vocabulary the inspector can write. A block stores TYPED
 * values (`{ base: { blockStart: '14' }, md: … }`), never class strings; the
 * mappers here turn them into utilities at render time.
 *
 * Tailwind builds its CSS by scanning source for class names, and an edit in
 * the Design canvas never rebuilds the app — so every class a mapper can
 * emit must exist ahead of time. `twSourceInline()` spells the whole set as
 * `@source inline(...)` lines; `styles/vocabulary.css` carries them verbatim
 * (`pnpm tw:vocabulary` rewrites them, `tw.test.ts` fails on drift).
 *
 * Stored props are untrusted: a mapper looks each value up in
 * its table and drops anything else, so no stored string ever reaches a
 * `class` attribute. Logical utilities only (`ps-`/`pe-`, `text-start`) —
 * the site renders under `dir="rtl"`.
 *
 * No imports: the vocabulary script reads this file on its own.
 */

/* -------------------------------------------------------------------------- */
/*                                 BREAKPOINTS                                */
/* -------------------------------------------------------------------------- */

/**
 * Mobile-first, matched one to one with the Design canvas viewports
 * (`theme.other.viewports`: 390 / 768 / 1180 / 1440). `styles/tailwind.css`
 * pins Tailwind's `md` / `lg` / `xl` to the same widths.
 */
export const BREAKPOINTS = ['base', 'md', 'lg', 'xl'] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];

export const BREAKPOINT_MIN_WIDTH: Record<Breakpoint, number> = {
  base: 0,
  md: 768,
  lg: 1180,
  xl: 1440,
};

/** One value per breakpoint; a missing one inherits the nearest smaller. */
export type Responsive<T> = { base: T } & Partial<Record<Exclude<Breakpoint, 'base'>, T>>;

const PREFIX: Record<Breakpoint, string> = { base: '', md: 'md:', lg: 'lg:', xl: 'xl:' };

/** The breakpoint a canvas of `width` px renders at. */
export function breakpointForWidth(width: number): Breakpoint {
  let current: Breakpoint = 'base';
  for (const bp of BREAKPOINTS) if (width >= BREAKPOINT_MIN_WIDTH[bp]) current = bp;
  return current;
}

/**
 * The value that applies at `bp`: its own, else the nearest smaller one's.
 * What the inspector shows before anything is overridden.
 */
export function valueAt<T>(value: Responsive<T> | undefined, bp: Breakpoint): T | undefined {
  if (!value) return undefined;
  const upTo = BREAKPOINTS.slice(0, BREAKPOINTS.indexOf(bp) + 1).reverse();
  for (const step of upTo) {
    const own = (value as Partial<Record<Breakpoint, T>>)[step];
    if (own !== undefined) return own;
  }
  return undefined;
}

/* -------------------------------------------------------------------------- */
/*                                   SCALES                                   */
/* -------------------------------------------------------------------------- */

/** Tailwind's spacing steps (1 = 4px) the inspector offers. */
export const SPACE_STEPS = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '8',
  '10',
  '12',
  '14',
  '16',
  '20',
  '24',
  '28',
  '32',
  '40',
] as const;
export type SpaceStep = (typeof SPACE_STEPS)[number];

/** A spacing step in px, for the inspector's `14 · 56px` label. */
export function spaceStepPx(step: SpaceStep): number {
  return Number(step) * 4;
}

/**
 * Text sizes: Tailwind's fixed scale, plus the theme's own five levels
 * (`text-site-xs … xl` read `--site-type-*`, which the theme edits live).
 */
export const TEXT_SIZES = [
  'site-xs',
  'site-sm',
  'site-md',
  'site-lg',
  'site-xl',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const ASPECT_RATIOS = ['square', '4/5', '3/4', '3/2', 'video'] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export type SpacingSteps = {
  blockStart: SpaceStep;
  blockEnd: SpaceStep;
  inlineStart: SpaceStep;
  inlineEnd: SpaceStep;
};

/* -------------------------------------------------------------------------- */
/*                                   MAPPERS                                  */
/* -------------------------------------------------------------------------- */

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function member<T extends string>(table: readonly T[], value: unknown): T | undefined {
  return typeof value === 'string' && (table as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

/** Each breakpoint's stored value, as far as it is an object at all. */
function perBreakpoint(value: unknown): Array<[Breakpoint, unknown]> {
  const record = asRecord(value);
  if (!record) return [];
  return BREAKPOINTS.filter((bp) => record[bp] !== undefined).map((bp) => [bp, record[bp]]);
}

/** `{ base: 'x', md: 'y' }` → `util-x md:util-y`, one table lookup per step. */
function responsiveClasses<T extends string>(
  value: unknown,
  table: readonly T[],
  toClass: (step: T) => string
): string[] {
  const classes: string[] = [];
  for (const [bp, raw] of perBreakpoint(value)) {
    const step = member(table, raw);
    if (step) classes.push(`${PREFIX[bp]}${toClass(step)}`);
  }
  return classes;
}

export function gapClasses(value: unknown): string[] {
  return responsiveClasses(value, SPACE_STEPS, (step) => `gap-${step}`);
}

export function aspectClasses(value: unknown): string[] {
  return responsiveClasses(value, ASPECT_RATIOS, (ratio) => `aspect-${ratio}`);
}

/* -------------------------------------------------------------------------- */
/*                                STYLE (SHARED)                              */
/* -------------------------------------------------------------------------- */

/*
 * The style set every block — and every styleable element inside one — can
 * carry (`styleSchema` in `style-props.ts`). One value per breakpoint, each a
 * partial record: a property a breakpoint leaves out inherits the smaller
 * breakpoint's, which is just the CSS cascade of `md:` over the base class.
 * Colours and fonts are not here: they are variables behind fixed utilities
 * (`shared.tsx`'s `boxStyle`), since the theme owns their values.
 */

/** Margin steps: the spacing scale, its negatives, and `auto`. */
export const MARGIN_STEPS = [
  ...SPACE_STEPS,
  ...SPACE_STEPS.filter((step) => step !== '0').map((step) => `-${step}` as const),
  'auto',
] as const;
export type MarginStep = (typeof MARGIN_STEPS)[number];

/** `site` / `site-pill` read the theme's own radius. */
export const RADII = [
  'none',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  'full',
  'site',
  'site-pill',
] as const;
export type Radius = (typeof RADII)[number];

export const BORDER_WIDTHS = ['0', '1', '2', '4', '8'] as const;
export const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double', 'none'] as const;
export const SHADOWS = ['none', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
export const OPACITIES = [
  '0',
  '5',
  '10',
  '20',
  '25',
  '30',
  '40',
  '50',
  '60',
  '70',
  '75',
  '80',
  '90',
  '95',
  '100',
] as const;
export const WIDTHS = [
  'auto',
  'full',
  'fit',
  'min',
  'max',
  '1/2',
  '1/3',
  '2/3',
  '1/4',
  '3/4',
] as const;
export const MAX_WIDTHS = [
  'none',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  'prose',
  'site-content',
  'full',
] as const;
export const MIN_HEIGHTS = ['0', 'full', 'screen', 'svh', 'dvh'] as const;
export const OVERFLOWS = ['visible', 'hidden', 'clip', 'auto'] as const;

/* Typography — Tailwind's own utilities, font size included (`TEXT_SIZES`). */
export const WEIGHTS = [
  'thin',
  'extralight',
  'light',
  'normal',
  'medium',
  'semibold',
  'bold',
  'extrabold',
  'black',
] as const;
export const LEADINGS = ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'] as const;
export const TRACKINGS = ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest'] as const;
export const TEXT_TRANSFORMS = ['none', 'uppercase', 'lowercase', 'capitalize'] as const;
export const TEXT_ALIGNS = ['start', 'center', 'end', 'justify'] as const;
export const TEXT_WRAPS = ['wrap', 'balance', 'pretty', 'nowrap'] as const;
export const DECORATIONS = ['none', 'underline', 'line-through'] as const;

/* Grid placement: how many columns / rows a block inside a grid spans. */
export const COL_SPANS = ['1', '2', '3', '4', 'full'] as const;
export const ROW_SPANS = ['1', '2', '3'] as const;

type Sides<T> = Partial<Record<'blockStart' | 'blockEnd' | 'inlineStart' | 'inlineEnd', T>>;
type Corners<T> = Partial<Record<'startStart' | 'startEnd' | 'endStart' | 'endEnd', T>>;

/**
 * The free frame the Design canvas's handles write: a pixel size and a
 * rotation, per breakpoint, for ANY element — not a table value, since a
 * drag produces arbitrary numbers. Three fixed utilities read it through
 * variables (`styles/tailwind.css`'s `box-at-*`), the same trick a free
 * element's position uses, because the canvas never rebuilds Tailwind.
 *
 * `0` (or absent) means "as the layout has it": `width: auto`, no rotation.
 */
export type FrameValue = Partial<{ w: number; h: number; rotate: number }>;

export const FRAME_SIZE_MAX = 4000;
export const FRAME_ROTATION_MAX = 180;

export type StyleValue = Partial<{
  frame: FrameValue;
  padding: Sides<SpaceStep>;
  margin: Sides<MarginStep>;
  radius: Radius;
  corners: Corners<Radius>;
  borderWidth: (typeof BORDER_WIDTHS)[number];
  borderStyle: (typeof BORDER_STYLES)[number];
  shadow: (typeof SHADOWS)[number];
  opacity: (typeof OPACITIES)[number];
  width: (typeof WIDTHS)[number];
  maxWidth: (typeof MAX_WIDTHS)[number];
  minHeight: (typeof MIN_HEIGHTS)[number];
  overflow: (typeof OVERFLOWS)[number];
  hidden: boolean;
  textSize: TextSize;
  weight: (typeof WEIGHTS)[number];
  leading: (typeof LEADINGS)[number];
  tracking: (typeof TRACKINGS)[number];
  transform: (typeof TEXT_TRANSFORMS)[number];
  italic: boolean;
  textAlign: (typeof TEXT_ALIGNS)[number];
  textWrap: (typeof TEXT_WRAPS)[number];
  decoration: (typeof DECORATIONS)[number];
  colSpan: (typeof COL_SPANS)[number];
  rowSpan: (typeof ROW_SPANS)[number];
}>;

/** One enum-valued property: its table and the class a value maps to. */
const ENUM_PROPS: Array<[keyof StyleValue, readonly string[], (value: string) => string]> = [
  ['radius', RADII, (value) => `rounded-${value}`],
  ['borderWidth', BORDER_WIDTHS, (value) => `border-${value}`],
  ['borderStyle', BORDER_STYLES, (value) => `border-${value}`],
  ['shadow', SHADOWS, (value) => `shadow-${value}`],
  ['opacity', OPACITIES, (value) => `opacity-${value}`],
  ['width', WIDTHS, (value) => `w-${value}`],
  ['maxWidth', MAX_WIDTHS, (value) => `max-w-${value}`],
  ['minHeight', MIN_HEIGHTS, (value) => `min-h-${value}`],
  ['overflow', OVERFLOWS, (value) => `overflow-${value}`],
  ['textSize', TEXT_SIZES, (value) => `text-${value}`],
  ['weight', WEIGHTS, (value) => `font-${value}`],
  ['leading', LEADINGS, (value) => `leading-${value}`],
  ['tracking', TRACKINGS, (value) => `tracking-${value}`],
  ['transform', TEXT_TRANSFORMS, (value) => (value === 'none' ? 'normal-case' : value)],
  ['textAlign', TEXT_ALIGNS, (value) => `text-${value}`],
  ['textWrap', TEXT_WRAPS, (value) => `text-${value}`],
  ['decoration', DECORATIONS, (value) => (value === 'none' ? 'no-underline' : value)],
  ['colSpan', COL_SPANS, (value) => `col-span-${value}`],
  ['rowSpan', ROW_SPANS, (value) => `row-span-${value}`],
];

const CORNER_UTILITY: Record<keyof Corners<Radius>, string> = {
  startStart: 'rounded-ss',
  startEnd: 'rounded-se',
  endStart: 'rounded-es',
  endEnd: 'rounded-ee',
};

/** `blockStart`… → the shortest utilities: `p-6`, `py-14 px-10`, `pt-20 ps-4`. */
function sideClasses(
  raw: unknown,
  table: readonly string[],
  u: { all: string; block: string; inline: string; sides: Record<string, string> }
): string[] {
  const record = asRecord(raw);
  if (!record) return [];
  const side = (key: string) => member(table, record[key]);
  const bs = side('blockStart');
  const be = side('blockEnd');
  const is = side('inlineStart');
  const ie = side('inlineEnd');
  const cls = (utility: string, step: string) =>
    step.startsWith('-') ? `-${utility}-${step.slice(1)}` : `${utility}-${step}`;
  if (bs && bs === be && bs === is && bs === ie) return [cls(u.all, bs)];
  const out: string[] = [];
  if (bs && bs === be) out.push(cls(u.block, bs));
  else {
    if (bs) out.push(cls(u.sides.blockStart ?? '', bs));
    if (be) out.push(cls(u.sides.blockEnd ?? '', be));
  }
  if (is && is === ie) out.push(cls(u.inline, is));
  else {
    if (is) out.push(cls(u.sides.inlineStart ?? '', is));
    if (ie) out.push(cls(u.sides.inlineEnd ?? '', ie));
  }
  return out;
}

const PADDING = {
  all: 'p',
  block: 'py',
  inline: 'px',
  sides: { blockStart: 'pt', blockEnd: 'pb', inlineStart: 'ps', inlineEnd: 'pe' },
};
const MARGIN = {
  all: 'm',
  block: 'my',
  inline: 'mx',
  sides: { blockStart: 'mt', blockEnd: 'mb', inlineStart: 'ms', inlineEnd: 'me' },
};

/** The classes of one breakpoint's value, unprefixed. */
function styleValueClasses(raw: unknown): string[] {
  const value = asRecord(raw);
  if (!value) return [];
  const out = [
    ...sideClasses(value.padding, SPACE_STEPS, PADDING),
    ...sideClasses(value.margin, MARGIN_STEPS, MARGIN),
  ];
  for (const [prop, table, toClass] of ENUM_PROPS) {
    const step = member(table, value[prop]);
    if (step) out.push(toClass(step));
  }
  const corners = asRecord(value.corners);
  if (corners) {
    for (const [corner, utility] of Object.entries(CORNER_UTILITY)) {
      const step = member(RADII, corners[corner]);
      if (step) out.push(`${utility}-${step}`);
    }
  }
  if (value.italic === true) out.push('italic');
  else if (value.italic === false) out.push('not-italic');
  return out;
}

/**
 * `hidden` per breakpoint → a display range, not `hidden md:block`: the
 * element's own display (grid, flex…) must survive where it shows. A
 * breakpoint without a `hidden` of its own inherits the smaller one's.
 */
const HIDDEN_RANGE: Record<Breakpoint, string> = {
  base: 'max-md:hidden',
  md: 'md:max-lg:hidden',
  lg: 'lg:max-xl:hidden',
  xl: 'xl:hidden',
};

/**
 * A frame's per-breakpoint switch, spelled out: Tailwind scans this file for
 * the classes it must generate, so every one has to exist as a literal.
 */
const BOX_AT: Record<Breakpoint, string> = {
  base: 'box-at-base',
  md: 'md:box-at-md',
  lg: 'lg:box-at-lg',
  xl: 'xl:box-at-xl',
};

function frameNumber(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.min(Math.max(min, Math.round(value)), max);
}

/** One breakpoint's stored frame, clamped; `undefined` when it states nothing. */
export function readFrame(raw: unknown): FrameValue | undefined {
  const record = asRecord(raw);
  if (!record) return undefined;
  const out: FrameValue = {};
  const w = frameNumber(record.w, 0, FRAME_SIZE_MAX);
  const h = frameNumber(record.h, 0, FRAME_SIZE_MAX);
  const rotate = frameNumber(record.rotate, -FRAME_ROTATION_MAX, FRAME_ROTATION_MAX);
  if (w !== undefined) out.w = w;
  if (h !== undefined) out.h = h;
  if (rotate !== undefined) out.rotate = rotate;
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Whether a stored style sets a frame width at any breakpoint. */
export function hasFrameWidth(raw: unknown): boolean {
  const record = asRecord(raw);
  if (!record) return false;
  return BREAKPOINTS.some((bp) => readFrame(asRecord(record[bp])?.frame)?.w !== undefined);
}

/**
 * A responsive style's frame → the variables its utilities read, one set per
 * breakpoint that states one, and the utilities themselves. A breakpoint
 * without a frame of its own keeps the nearest smaller one's, like every
 * other responsive value; `w-(--bw)` is only added when some breakpoint
 * actually sets a width, so a rotation alone never overrides a block's own.
 */
export function frameStyle(raw: unknown): { classes: string[]; vars: Record<string, string> } {
  const record = asRecord(raw);
  if (!record) return { classes: [], vars: {} };
  const stated = BREAKPOINTS.map((bp) => readFrame(asRecord(record[bp])?.frame));
  if (stated.every((frame) => frame === undefined)) return { classes: [], vars: {} };

  const classes: string[] = [];
  const vars: Record<string, string> = {};
  const has = { w: false, h: false, rotate: false };
  let current: FrameValue = {};
  BREAKPOINTS.forEach((bp, index) => {
    const frame = stated[index];
    /* `base` always, so the unsuffixed variables never resolve to nothing. */
    if (!frame && bp !== 'base') return;
    current = { ...current, ...frame };
    if (frame?.w !== undefined) has.w = true;
    if (frame?.h !== undefined) has.h = true;
    if (frame?.rotate !== undefined) has.rotate = true;
    const size = (value: number | undefined) =>
      value !== undefined && value > 0 ? `${value}px` : 'auto';
    vars[`--bw-${bp}`] = size(current.w);
    vars[`--bh-${bp}`] = size(current.h);
    vars[`--brot-${bp}`] = `${current.rotate ?? 0}deg`;
    classes.push(BOX_AT[bp]);
  });
  if (has.w) classes.push('w-(--bw)');
  if (has.h) classes.push('h-(--bh)');
  if (has.rotate) classes.push('rotate-(--brot)');
  return { classes, vars };
}

/** A responsive style (`{ base, md, lg, xl }`) → its utilities. */
export function styleClasses(raw: unknown): string[] {
  const record = asRecord(raw);
  if (!record) return [];
  const out: string[] = [];
  let hidden = false;
  for (const bp of BREAKPOINTS) {
    const value = asRecord(record[bp]);
    for (const cls of styleValueClasses(value)) out.push(`${PREFIX[bp]}${cls}`);
    if (typeof value?.hidden === 'boolean') hidden = value.hidden;
    if (hidden) out.push(HIDDEN_RANGE[bp]);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*                                   MERGE                                    */
/* -------------------------------------------------------------------------- */

const SIZE_TOKENS = new Set<string>(TEXT_SIZES);
const ALIGN_TOKENS = new Set<string>(TEXT_ALIGNS);
const WRAP_TOKENS = new Set<string>(TEXT_WRAPS);
const WEIGHT_TOKENS = new Set<string>(WEIGHTS);
const BORDER_WIDTH_TOKENS = new Set<string>(['', ...BORDER_WIDTHS]);
const BORDER_STYLE_TOKENS = new Set<string>(BORDER_STYLES);

/**
 * The property a utility sets, as far as a style can set it too — what
 * decides whether a designer's value replaces a block's default. `null` for
 * everything a style never touches (layout, grid, flex…): those always stay.
 */
function utilityGroup(utility: string): string | null {
  const bare = utility.replace(/^-/, '');
  const [head = '', ...rest] = bare.split('-');
  const tail = rest.join('-');
  if (/^p[xytbse]?$/.test(head)) return 'padding';
  if (/^m[xytbse]?$/.test(head)) return 'margin';
  if (head === 'rounded') return 'radius';
  if (head === 'shadow') return 'shadow';
  if (head === 'opacity') return 'opacity';
  if (head === 'w') return 'width';
  if (head === 'max' && rest[0] === 'w') return 'max-width';
  if (head === 'min' && rest[0] === 'h') return 'min-height';
  if (head === 'overflow') return 'overflow';
  if (head === 'leading') return 'leading';
  if (head === 'tracking') return 'tracking';
  if (head === 'bg') return 'background';
  if (['uppercase', 'lowercase', 'capitalize', 'normal-case'].includes(bare)) return 'transform';
  if (['italic', 'not-italic'].includes(bare)) return 'italic';
  if (['underline', 'line-through', 'no-underline'].includes(bare)) return 'decoration';
  if (bare === 'hidden' || bare === 'block') return 'display';
  /* A caller's `absolute` replaces a figure's default `relative`: Tailwind sorts
     `.relative` after `.absolute`, so with both the box stayed in the flow. */
  if (['static', 'relative', 'absolute', 'fixed', 'sticky'].includes(bare)) return 'position';
  if (head === 'text') {
    /* An arbitrary size: `text-[length:…]`, `text-[calc(…)]`, `text-[10px]`,
       `text-(length:--x)`; any other arbitrary value is a colour. */
    if (
      SIZE_TOKENS.has(tail) ||
      /^[[(]length:/.test(tail) ||
      /^\[(calc|clamp|min|max)\(/.test(tail) ||
      /^\[[\d.]+(px|r?em|%|vw|vh|ch)\]$/.test(tail)
    ) {
      return 'text-size';
    }
    if (ALIGN_TOKENS.has(tail)) return 'text-align';
    if (WRAP_TOKENS.has(tail)) return 'text-wrap';
    return 'text-color';
  }
  if (head === 'font') {
    /* `font-(--x)` is a weight; a family through a variable says `family-name:`. */
    if (WEIGHT_TOKENS.has(tail) || /^\(--[\w-]+\)$/.test(tail)) return 'weight';
    return 'font-family';
  }
  if (head === 'border') {
    if (BORDER_WIDTH_TOKENS.has(tail)) return 'border-width';
    if (BORDER_STYLE_TOKENS.has(tail)) return 'border-style';
    if (/^[xytbse]$/.test(tail) || /^[xytbse]-\d+$/.test(tail)) return 'border-width';
    return 'border-color';
  }
  return null;
}

const BP_ORDER: Record<string, number> = { '': 0, 'md:': 1, 'lg:': 2, 'xl:': 3 };

/**
 * `lg:hover:pt-4` → breakpoint rank 2, other variants `hover:`, utility
 * `pt-4`. Only the min-width breakpoints rank; any other variant (`rtl:`,
 * `hover:`, `max-md:`) must match exactly.
 */
function parseClass(cls: string): { rank: number; rest: string; utility: string } {
  /* The last `:` outside brackets: `text-[length:1rem]` has no variant. */
  let at = -1;
  let depth = 0;
  for (let index = 0; index < cls.length; index += 1) {
    const char = cls[index];
    if (char === '[' || char === '(') depth += 1;
    else if (char === ']' || char === ')') depth -= 1;
    else if (char === ':' && depth === 0) at = index;
  }
  const variant = at < 0 ? '' : cls.slice(0, at + 1);
  const utility = at < 0 ? cls : cls.slice(at + 1);
  const bp = /^(md|lg|xl):/.exec(variant)?.[0] ?? '';
  return { rank: BP_ORDER[bp] ?? 0, rest: variant.slice(bp.length), utility };
}

/**
 * A block's default utilities, minus every one a designer's style replaces:
 * same property, same non-breakpoint variant, at the style's breakpoint or
 * any larger one — a size set on the phone carries up over the block's own
 * `md:` default, as the designer expects; one set on the tablet leaves the
 * phone's default alone. Two utilities for one property never both reach the
 * element, so the designer's always wins without leaning on Tailwind's CSS
 * order.
 */
export function mergeClasses(defaults: string, overrides: readonly string[]): string[] {
  const taken = new Map<string, number>();
  for (const cls of overrides) {
    const { rank, rest, utility } = parseClass(cls);
    const group = utilityGroup(utility);
    if (!group) continue;
    const key = `${rest}${group}`;
    taken.set(key, Math.min(taken.get(key) ?? rank, rank));
  }
  const kept = defaults.split(/\s+/).filter((cls) => {
    if (!cls) return false;
    const { rank, rest, utility } = parseClass(cls);
    const group = utilityGroup(utility);
    if (!group) return true;
    const from = taken.get(`${rest}${group}`);
    return from === undefined || rank < from;
  });
  return [...kept, ...overrides];
}

/** Class list → one attribute value; falsy entries dropped. */
export function cx(...parts: Array<string | string[] | false | null | undefined>): string {
  return parts
    .flat()
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ');
}

/* -------------------------------------------------------------------------- */
/*                            RESPONSIVE LITERALS                        */
/* -------------------------------------------------------------------------- */

/*
 * Per-breakpoint utilities a layout block's OWN props map to (a grid's column
 * count, a stack's direction). Spelled out as literals so Tailwind's scan of
 * this file generates every one — the canvas never rebuilds, and a build
 * scans `renderer/blocks`.
 */

export const COLUMN_COUNTS = ['1', '2', '3', '4', '5', '6'] as const;
export type ColumnCount = (typeof COLUMN_COUNTS)[number];

export const GRID_COLUMN_CLASSES: Record<Breakpoint, Record<ColumnCount, string>> = {
  base: {
    '1': 'grid-cols-1',
    '2': 'grid-cols-2',
    '3': 'grid-cols-3',
    '4': 'grid-cols-4',
    '5': 'grid-cols-5',
    '6': 'grid-cols-6',
  },
  md: {
    '1': 'md:grid-cols-1',
    '2': 'md:grid-cols-2',
    '3': 'md:grid-cols-3',
    '4': 'md:grid-cols-4',
    '5': 'md:grid-cols-5',
    '6': 'md:grid-cols-6',
  },
  lg: {
    '1': 'lg:grid-cols-1',
    '2': 'lg:grid-cols-2',
    '3': 'lg:grid-cols-3',
    '4': 'lg:grid-cols-4',
    '5': 'lg:grid-cols-5',
    '6': 'lg:grid-cols-6',
  },
  xl: {
    '1': 'xl:grid-cols-1',
    '2': 'xl:grid-cols-2',
    '3': 'xl:grid-cols-3',
    '4': 'xl:grid-cols-4',
    '5': 'xl:grid-cols-5',
    '6': 'xl:grid-cols-6',
  },
};

/** CSS multi-column counts, for a masonry gallery. */
export const MASONRY_COLUMN_CLASSES: Record<Breakpoint, Record<ColumnCount, string>> = {
  base: {
    '1': 'columns-1',
    '2': 'columns-2',
    '3': 'columns-3',
    '4': 'columns-4',
    '5': 'columns-5',
    '6': 'columns-6',
  },
  md: {
    '1': 'md:columns-1',
    '2': 'md:columns-2',
    '3': 'md:columns-3',
    '4': 'md:columns-4',
    '5': 'md:columns-5',
    '6': 'md:columns-6',
  },
  lg: {
    '1': 'lg:columns-1',
    '2': 'lg:columns-2',
    '3': 'lg:columns-3',
    '4': 'lg:columns-4',
    '5': 'lg:columns-5',
    '6': 'lg:columns-6',
  },
  xl: {
    '1': 'xl:columns-1',
    '2': 'xl:columns-2',
    '3': 'xl:columns-3',
    '4': 'xl:columns-4',
    '5': 'xl:columns-5',
    '6': 'xl:columns-6',
  },
};

export const FLEX_DIRECTIONS = ['row', 'column', 'row-reverse'] as const;
export type FlexDirection = (typeof FLEX_DIRECTIONS)[number];

export const FLEX_DIRECTION_CLASSES: Record<Breakpoint, Record<FlexDirection, string>> = {
  base: { row: 'flex-row', column: 'flex-col', 'row-reverse': 'flex-row-reverse' },
  md: { row: 'md:flex-row', column: 'md:flex-col', 'row-reverse': 'md:flex-row-reverse' },
  lg: { row: 'lg:flex-row', column: 'lg:flex-col', 'row-reverse': 'lg:flex-row-reverse' },
  xl: { row: 'xl:flex-row', column: 'xl:flex-col', 'row-reverse': 'xl:flex-row-reverse' },
};

/**
 * A responsive prop (`{ base, md?, lg?, xl? }`) → the literal class of each
 * breakpoint it states, through a table like the ones above. A number is
 * read as its string key; anything off the table is dropped.
 */
export function responsiveLiteralClasses<K extends string>(
  value: unknown,
  table: Record<Breakpoint, Record<K, string>>,
  fallback?: K
): string[] {
  const record = asRecord(value);
  const out: string[] = [];
  let stated = false;
  for (const bp of BREAKPOINTS) {
    const raw = record?.[bp];
    const key = typeof raw === 'number' ? String(raw) : raw;
    const cls = typeof key === 'string' ? table[bp][key as K] : undefined;
    if (cls) {
      out.push(cls);
      stated = true;
    }
  }
  if (!stated && fallback) out.push(table.base[fallback]);
  return out;
}

/* -------------------------------------------------------------------------- */
/*                              FREE LAYOUT                          */
/* -------------------------------------------------------------------------- */

/*
 * A free section (`section.layout: 'free'`) lays its blocks on a column grid,
 * Readymag's art direction without absolute pixels: each child stores a
 * `place` per breakpoint — a document field (`DocNode.place`), since where a
 * block sits belongs to its parent — and the mappers below turn it into grid
 * utilities. Every one sits behind the `free:` variant (`styles/tailwind.css`:
 * a direct child of `.hl-free`), so a `place` left on a block moved out of a
 * free section draws nothing.
 *
 * Breakpoints: below `md` the grid stacks its children in document order
 * (the container's `*:col-span-full`) unless a child has a `base` place.
 * From `md` up a breakpoint without a place of its own takes the nearest
 * smaller one from `md` up, else the nearest larger, else `base` — a layout
 * drawn at desktop width holds on a tablet until the tablet is rearranged.
 */

export const FREE_COLUMN_COUNTS = ['4', '6', '8', '12'] as const;
export type FreeColumnCount = (typeof FREE_COLUMN_COUNTS)[number];
export const FREE_COLUMNS_DEFAULT: FreeColumnCount = '12';

/** A free grid's row module: a spacing step, named so the inspector can label it. */
export const FREE_ROW_UNITS = { sm: '6', md: '8', lg: '12' } as const satisfies Record<
  string,
  SpaceStep
>;
export type FreeRowUnit = keyof typeof FREE_ROW_UNITS;
export const FREE_ROW_UNIT_DEFAULT: FreeRowUnit = 'md';

export const PLACE_COLUMN_MAX = 12;
export const PLACE_ROW_MAX = 48;
export const PLACE_ROW_SPAN_MAX = 24;
export const PLACE_Z_MAX = 10;
export const PLACE_ROTATION_MAX = 180;
/** What rotation snaps to by default (the canvas's ⇧ turns it off). */
export const PLACE_ROTATION_STEP = 15;

/** One breakpoint's cell range: 1-based grid lines, as `col-start-*` reads them. */
export type PlaceValue = {
  colStart: number;
  colSpan: number;
  rowStart: number;
  rowSpan: number;
  z?: number;
  rotate?: number;
};
/** A free child's places; any breakpoint may be missing, `base` included. */
export type Place = Partial<Record<Breakpoint, PlaceValue>>;

/**
 * The grid itself; its columns come from `FREE_COLUMN_CLASSES`, its row
 * module from `--hl-free-row`. An empty grid has no rows, so it keeps a
 * floor (`min-h-24`): a free section is a surface to place things on, and
 * the canvas has to be able to drop into it.
 */
export const FREE_GRID_CLASSES =
  'hl-free grid min-h-24 content-start auto-rows-[minmax(var(--hl-free-row),auto)] gap-[var(--site-slot-gap,18px)] *:col-span-full';

export const FREE_COLUMN_CLASSES: Record<Breakpoint, Record<FreeColumnCount, string>> = {
  base: { '4': 'grid-cols-4', '6': 'grid-cols-6', '8': 'grid-cols-8', '12': 'grid-cols-12' },
  md: {
    '4': 'md:grid-cols-4',
    '6': 'md:grid-cols-6',
    '8': 'md:grid-cols-8',
    '12': 'md:grid-cols-12',
  },
  lg: {
    '4': 'lg:grid-cols-4',
    '6': 'lg:grid-cols-6',
    '8': 'lg:grid-cols-8',
    '12': 'lg:grid-cols-12',
  },
  xl: {
    '4': 'xl:grid-cols-4',
    '6': 'xl:grid-cols-6',
    '8': 'xl:grid-cols-8',
    '12': 'xl:grid-cols-12',
  },
};

function placeInt(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.min(Math.max(min, Math.round(value)), max);
}

/** A free section's column count at each breakpoint, `base` always stated. */
export function freeColumnsOf(raw: unknown): Record<Breakpoint, number> {
  const record = asRecord(raw);
  const out = {} as Record<Breakpoint, number>;
  let current = Number(FREE_COLUMNS_DEFAULT);
  for (const bp of BREAKPOINTS) {
    const stated = record?.[bp];
    const step = member(FREE_COLUMN_COUNTS, typeof stated === 'number' ? String(stated) : stated);
    if (step) current = Number(step);
    out[bp] = current;
  }
  return out;
}

/** The grid's utilities: its own, then one column count per stated breakpoint. */
export function freeGridClasses(columns: unknown): string[] {
  const out = [FREE_GRID_CLASSES];
  const record = asRecord(columns);
  if (!member(FREE_COLUMN_COUNTS, String(record?.base ?? ''))) {
    out.push(FREE_COLUMN_CLASSES.base[FREE_COLUMNS_DEFAULT]);
  }
  return [...out, ...responsiveLiteralClasses(columns, FREE_COLUMN_CLASSES)];
}

/** The row module as a length: a spacing step of the site's own scale. */
export function freeRowUnitValue(unit: unknown): string {
  const step =
    FREE_ROW_UNITS[
      member(Object.keys(FREE_ROW_UNITS) as FreeRowUnit[], unit) ?? FREE_ROW_UNIT_DEFAULT
    ];
  return `calc(var(--spacing, 0.25rem) * ${step})`;
}

/** One breakpoint's stored place, clamped; `undefined` unless it names a cell range. */
export function readPlaceValue(raw: unknown): PlaceValue | undefined {
  const record = asRecord(raw);
  if (!record) return undefined;
  const colStart = placeInt(record.colStart, 1, PLACE_COLUMN_MAX);
  const rowStart = placeInt(record.rowStart, 1, PLACE_ROW_MAX);
  if (colStart === undefined || rowStart === undefined) return undefined;
  const colSpan = placeInt(record.colSpan, 1, PLACE_COLUMN_MAX - colStart + 1) ?? 1;
  const rowSpan = placeInt(record.rowSpan, 1, PLACE_ROW_SPAN_MAX) ?? 1;
  const z = placeInt(record.z, 0, PLACE_Z_MAX);
  const rotate = placeInt(record.rotate, -PLACE_ROTATION_MAX, PLACE_ROTATION_MAX);
  return {
    colStart,
    colSpan,
    rowStart,
    rowSpan,
    ...(z !== undefined ? { z } : {}),
    ...(rotate !== undefined ? { rotate } : {}),
  };
}

/** A stored `place`, every breakpoint read; the ones that state nothing left out. */
export function readPlace(raw: unknown): Place {
  const record = asRecord(raw);
  const out: Place = {};
  if (!record) return out;
  for (const bp of BREAKPOINTS) {
    const value = readPlaceValue(record[bp]);
    if (value) out[bp] = value;
  }
  return out;
}

/** The place that applies at `bp` (the rule above); `undefined` = stacked. */
export function placeAt(raw: unknown, bp: Breakpoint): PlaceValue | undefined {
  const place = readPlace(raw);
  if (bp === 'base') return place.base;
  const upper = BREAKPOINTS.slice(1);
  const index = upper.indexOf(bp);
  for (let at = index; at >= 0; at -= 1) {
    const own = place[upper[at] as Breakpoint];
    if (own) return own;
  }
  for (let at = index + 1; at < upper.length; at += 1) {
    const larger = place[upper[at] as Breakpoint];
    if (larger) return larger;
  }
  return place.base;
}

function placeValueClasses(
  value: PlaceValue,
  prefix: string,
  extras: { z: boolean; rotate: boolean }
) {
  const p = `${prefix}free:`;
  const out = [
    `${p}col-start-${value.colStart}`,
    `${p}col-span-${value.colSpan}`,
    `${p}row-start-${value.rowStart}`,
    `${p}row-span-${value.rowSpan}`,
  ];
  if (extras.z) out.push(`${p}z-${value.z ?? 0}`);
  if (extras.rotate) {
    const turn = value.rotate ?? 0;
    out.push(turn < 0 ? `${p}-rotate-${-turn}` : `${p}rotate-${turn}`);
  }
  return out;
}

/**
 * A stored `place` → its utilities: each breakpoint's effective place where
 * it differs from the one below it. Nothing at all for a block never placed
 * (the grid stacks it), so every other block's markup is unchanged.
 */
export function placeClasses(raw: unknown): string[] {
  const place = readPlace(raw);
  const stated = Object.values(place);
  if (stated.length === 0) return [];
  const extras = {
    z: stated.some((value) => value.z !== undefined && value.z !== 0),
    rotate: stated.some((value) => value.rotate !== undefined && value.rotate !== 0),
  };
  const out: string[] = [];
  let previous = '';
  for (const bp of BREAKPOINTS) {
    const value = placeAt(place, bp);
    const key = value ? JSON.stringify(value) : '';
    if (!value || key === previous) continue;
    previous = key;
    out.push(...placeValueClasses(value, PREFIX[bp], extras));
  }
  return out;
}

/** `place` with `bp`'s cell range replaced (or removed with `null`): what the canvas stores. */
export function withPlaceAt(raw: unknown, bp: Breakpoint, value: PlaceValue | null): Place {
  const next: Place = { ...readPlace(raw) };
  if (value) next[bp] = value;
  else delete next[bp];
  return next;
}

/* -------------------------------------------------------------------------- */
/*                              SURFACE AND MOTION                            */
/* -------------------------------------------------------------------------- */

/*
 * A style's SURFACE: a background image, a gradient, a colour overlay —
 * what a hero over a photo, a band with a wash, a section with a texture
 * need and no token had. The layers are composed into ONE `background-image`
 * value carried by `--s-bgi` (`shared.tsx`'s `boxStyle`), read by fixed
 * utilities listed here; the position, fit, repeat and attachment are the
 * utilities below. Nothing of the stored value reaches a class name.
 */

export const SURFACE_POSITIONS = [
  'center',
  'top',
  'bottom',
  'start',
  'end',
  'top-start',
  'top-end',
  'bottom-start',
  'bottom-end',
] as const;
export type SurfacePosition = (typeof SURFACE_POSITIONS)[number];

export const SURFACE_FITS = ['cover', 'contain'] as const;

/** CSS `background-position`; physical, since the position is an image's. */
export const SURFACE_POSITION_CSS: Record<SurfacePosition, string> = {
  center: 'center',
  top: 'center top',
  bottom: 'center bottom',
  start: 'left center',
  end: 'right center',
  'top-start': 'left top',
  'top-end': 'right top',
  'bottom-start': 'left bottom',
  'bottom-end': 'right bottom',
};

/** The fixed utilities a surface turns on; the values ride in variables. */
export const SURFACE_UTILITIES = {
  image: 'bg-[image:var(--s-bgi)]',
  position: 'bg-[position:var(--s-bgp)]',
  cover: 'bg-cover',
  contain: 'bg-contain',
  repeat: 'bg-repeat',
  noRepeat: 'bg-no-repeat',
  fixed: 'bg-fixed',
} as const;

/** Whether a stored style carries a surface worth drawing. */
export function hasSurface(raw: unknown): boolean {
  const surface = asRecord(asRecord(raw)?.surface);
  if (!surface) return false;
  return Boolean(
    asRecord(surface.image)?.url ||
    asRecord(asRecord(surface.gradient)?.from) ||
    asRecord(asRecord(surface.overlay)?.color)
  );
}

/** The utilities a surface switches on (its values are variables). */
export function surfaceClasses(raw: unknown): string[] {
  if (!hasSurface(raw)) return [];
  const surface = asRecord(asRecord(raw)?.surface) ?? {};
  return [
    SURFACE_UTILITIES.image,
    SURFACE_UTILITIES.position,
    member(SURFACE_FITS, surface.fit) === 'contain'
      ? SURFACE_UTILITIES.contain
      : SURFACE_UTILITIES.cover,
    surface.repeat === true ? SURFACE_UTILITIES.repeat : SURFACE_UTILITIES.noRepeat,
    ...(surface.fixed === true ? [SURFACE_UTILITIES.fixed] : []),
  ];
}

/*
 * MOTION: a reveal as the block scrolls into view, a hover response.
 * CSS only — `styles/site.css` defines the classes under
 * `@supports (animation-timeline: view())` and `motion-reduce` turns them
 * off — so a published page runs no script for it. Plain class names, not
 * utilities: nothing to generate.
 */
export const MOTION_REVEALS = ['none', 'fade', 'fade-up', 'scale-in'] as const;
export const MOTION_DELAYS = ['0', '1', '2', '3'] as const;
export const MOTION_HOVERS = ['none', 'lift', 'zoom', 'dim'] as const;

export function motionClasses(raw: unknown): string[] {
  const motion = asRecord(asRecord(raw)?.motion);
  if (!motion) return [];
  const out: string[] = [];
  const reveal = member(MOTION_REVEALS, motion.reveal);
  if (reveal && reveal !== 'none') {
    out.push('hl-reveal', `hl-reveal--${reveal}`);
    const delay = member(MOTION_DELAYS, motion.delay);
    if (delay && delay !== '0') out.push(`hl-delay-${delay}`);
  }
  const hover = member(MOTION_HOVERS, motion.hover);
  if (hover && hover !== 'none') out.push(`hl-hover--${hover}`);
  return out;
}

/* -------------------------------------------------------------------------- */
/*                                FREE CLASSES                                */
/* -------------------------------------------------------------------------- */

/*
 * Rung 2½ of the fidelity ladder: a style may carry Tailwind utilities
 * the tables above do not spell — `pt-[72px]`, `lg:grid-cols-[2fr_1fr]`,
 * `tracking-[-0.02em]`, `bg-[radial-gradient(…)]`. They are compiled where
 * they are shown (the canvas compiles them in the browser, a build scans
 * `site/tw-classes.txt`, a server route compiles the page's list), so the
 * vocabulary stays open without a rebuild.
 *
 * Stored props are untrusted, and these reach a `class`
 * attribute, an inline `<style>` and a Tailwind scan — so a token is a
 * closed set of characters, with no whitespace, no `url(`, no `< > { } ; @`
 * and balanced brackets. Anything else is dropped, never rewritten.
 */

/** The longest utility a style may carry (`bg-[linear-gradient(135deg,#fff,#000)]` is 41). */
export const CLASS_TOKEN_MAX = 80;
/** How many utilities one style may carry. */
export const CLASS_TOKENS_MAX = 40;

const CLASS_TOKEN = /^[A-Za-z0-9!_\-:/.[\]()%#,*+=&~^$|?]+$/;
const CLASS_FORBIDDEN = /url\(|src\(|image\(|image-set\(|\/\*|\*\/|expression|javascript/i;

function balanced(token: string): boolean {
  let square = 0;
  let round = 0;
  for (const char of token) {
    if (char === '[') square += 1;
    else if (char === ']') square -= 1;
    else if (char === '(') round += 1;
    else if (char === ')') round -= 1;
    if (square < 0 || round < 0) return false;
  }
  return square === 0 && round === 0;
}

/**
 * A stored `classes` string → the utilities kept and the ones refused, in
 * order, without duplicates. Never throws: the inspector shows `rejected`
 * under the field, the renderer uses `accepted`.
 */
export function classIssues(raw: unknown): { accepted: string[]; rejected: string[] } {
  const accepted: string[] = [];
  const rejected: string[] = [];
  if (typeof raw !== 'string') return { accepted, rejected };
  const seen = new Set<string>();
  for (const token of raw.split(/\s+/)) {
    if (!token || seen.has(token)) continue;
    seen.add(token);
    const ok =
      accepted.length < CLASS_TOKENS_MAX &&
      token.length <= CLASS_TOKEN_MAX &&
      CLASS_TOKEN.test(token) &&
      !CLASS_FORBIDDEN.test(token) &&
      balanced(token);
    (ok ? accepted : rejected).push(token);
  }
  return { accepted, rejected };
}

/** The utilities a stored `classes` string is allowed to put on an element. */
export function sanitiseClasses(raw: unknown): string[] {
  return classIssues(raw).accepted;
}

/**
 * Every free utility a site's stored styles carry — walked like
 * `siteStyleClasses`, over `style`, each `elements` entry and each item's
 * own style. What the canvas compiles live and a server route inlines.
 */
export function siteUtilityClasses(tree: unknown): string[] {
  const found = new Set<string>();
  const visit = (value: unknown, key: string | null): void => {
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, null));
      return;
    }
    const record = asRecord(value);
    if (!record) return;
    if (key === 'style') sanitiseClasses(record.classes).forEach((cls) => found.add(cls));
    if (key === 'elements') {
      Object.values(record).forEach((entry) =>
        sanitiseClasses(asRecord(entry)?.classes).forEach((cls) => found.add(cls))
      );
    }
    for (const [child, next] of Object.entries(record)) visit(next, child);
  };
  visit(tree, null);
  return [...found].sort();
}

/* -------------------------------------------------------------------------- */
/*                               A SITE'S CLASSES                             */
/* -------------------------------------------------------------------------- */

/**
 * Every class a site's stored styles map to — walked over anything (a
 * snapshot, a composition): each `style`, each entry of an `elements` map,
 * their free `classes`, and each breakpoint map (`{ base, md… }`)
 * through the responsive mappers.
 * What the builder writes to `site/tw-classes.txt`, so a published site's
 * CSS carries the classes it uses instead of the whole canvas vocabulary.
 * A mapper drops what is not its own, so over-reading costs nothing.
 */
export function siteStyleClasses(tree: unknown): string[] {
  const found = new Set<string>();
  const add = (classes: string[]) => classes.forEach((cls) => found.add(cls));
  const visit = (value: unknown, key: string | null): void => {
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, null));
      return;
    }
    const record = asRecord(value);
    if (!record) return;
    if (key === 'style') {
      add(styleClasses(record));
      add(surfaceClasses(record));
      add(motionClasses(record));
      add(sanitiseClasses(record.classes));
    }
    if (key === 'elements') {
      Object.values(record).forEach((entry) => {
        add(styleClasses(entry));
        add(surfaceClasses(entry));
        add(motionClasses(entry));
        add(sanitiseClasses(asRecord(entry)?.classes));
      });
    }
    if (key === 'place') add(placeClasses(record));
    if ('base' in record) {
      add(gapClasses(record));
      add(aspectClasses(record));
    }
    for (const [child, next] of Object.entries(record)) visit(next, child);
  };
  visit(tree, null);
  return [...found].sort();
}

/* -------------------------------------------------------------------------- */
/*                                 VOCABULARY                                 */
/* -------------------------------------------------------------------------- */

const brace = (items: readonly string[]): string => `{${items.join(',')}}`;
const PREFIXES = brace(BREAKPOINTS.map((bp) => PREFIX[bp]));
const range = (from: number, to: number): string[] =>
  Array.from({ length: to - from + 1 }, (_, index) => String(from + index));

/**
 * The `@source inline(...)` lines that make Tailwind generate every class
 * the mappers above can emit — in the app, where nothing rebuilds on edit,
 * and in the starter alike.
 */
export function twSourceInline(): string[] {
  const positive = SPACE_STEPS;
  const negative = SPACE_STEPS.filter((step) => step !== '0');
  const line = (body: string) => `@source inline("${PREFIXES}${body}");`;
  return [
    line(`${brace(['p', 'py', 'px', 'pt', 'pb', 'ps', 'pe'])}-${brace(positive)}`),
    line(`${brace(['m', 'my', 'mx', 'mt', 'mb', 'ms', 'me'])}-${brace([...positive, 'auto'])}`),
    line(`-${brace(['m', 'my', 'mx', 'mt', 'mb', 'ms', 'me'])}-${brace(negative)}`),
    line(`gap-${brace(SPACE_STEPS)}`),
    line(`aspect-${brace(ASPECT_RATIOS)}`),
    line(`${brace(['rounded', ...Object.values(CORNER_UTILITY)])}-${brace(RADII)}`),
    ...ENUM_PROPS.filter(([prop]) => prop !== 'radius').map(([, table, toClass]) =>
      line(brace(table.map(toClass)))
    ),
    line('{italic,not-italic}'),
    `@source inline("${brace(Object.values(HIDDEN_RANGE))}");`,
    `@source inline("${brace(Object.values(SURFACE_UTILITIES))}");`,
    /* A free child's place: cell lines, layers and turns. */
    line(`free:col-start-${brace(range(1, PLACE_COLUMN_MAX))}`),
    line(`free:col-span-${brace(range(1, PLACE_COLUMN_MAX))}`),
    line(`free:row-start-${brace(range(1, PLACE_ROW_MAX))}`),
    line(`free:row-span-${brace(range(1, PLACE_ROW_SPAN_MAX))}`),
    line(`free:z-${brace(range(0, PLACE_Z_MAX))}`),
    line(`free:rotate-{0..${PLACE_ROTATION_MAX}}`),
    line(`free:-rotate-{1..${PLACE_ROTATION_MAX}}`),
  ];
}
