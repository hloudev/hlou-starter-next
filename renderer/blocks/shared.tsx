/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CSSProperties, ReactElement, ReactNode } from 'react';
import type {
  Bound,
  CollectionRef,
  ResolvedCollection,
  ResolvedMedia,
  ResolvedRecord,
  SiteThemeTypography,
  StateRef,
} from '../contracts';
import type { IconName } from './icon-paths';
import type { ColorValue, FontValue } from './style-props';
import type { SiteRenderContext } from './types';
import { schemeOf } from './design-options';
import { ICON_PATHS, isIconName } from './icon-paths';
import { MEDIA_SIZES_ATTR, mediaImgAttrs, surfaceImageUrls } from './media';
import {
  cx,
  frameStyle,
  hasSurface,
  mergeClasses,
  placeClasses,
  sanitiseClasses,
  styleClasses,
  SURFACE_POSITION_CSS,
  surfaceClasses,
} from './tw';
import { readRenderContext, THEME_METADATA_KEY } from './types';

/* The zod-free halves of the contracts: this markup ships in browser islands. */
import { countryName, formatPhone } from '../contracts/country-format';
import {
  isFontFamilyName,
  isHexColour,
  isRecordRef,
  isResolvedCollection,
  isResolvedMedia,
  isSlotRef,
  isStateRef,
  isThemeRoleKey,
  SITE_THEME_TYPOGRAPHY_KEYS,
} from '../contracts/guards';
import { formatMoney, isMoneyValue } from '../contracts/money-format';
import { motionAttribute } from '../motion/compile';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type BlockRootAttributes = {
  'data-hl-block': string;
  'data-hl-block-type': string;
  lang: string;
  dir: 'ltr' | 'rtl';
  className: string;
  /** The colour scheme the block sits on: `SiteRoot` emits one rule per theme scheme. */
  'data-hl-scheme'?: string;
  /** Its `when`, as JSON, inside a scope: the scope runtime re-evaluates it. */
  'data-hl-when'?: string;
  /** Present while its `when` is false: `site.css` hides it. */
  'data-hl-off'?: '';
  /** The block's own motion (M47, `motion/compile.ts`), set by `blockParts`. */
  'data-hl-motion'?: string;
};

export type ListingMapping = {
  titleField: string;
  imageField: string;
  metaField: string;
  priceField: string;
  hrefTemplate: string;
};

export type ListingItem = {
  id: string;
  title: string;
  meta: string;
  price: string;
  image: ResolvedMedia | null;
  href: string | undefined;
};

/** The node fields a block receives in Puck and from `renderDoc` (`DOC_SIDE_MAP_PROP`). */
const SIDE_MAP_PROP = '__hl';

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * The attributes every block root carries: the pin / agent anchor
 * (`data-hl-block`), the type, `lang` / `dir` inherited from `SiteRender`,
 * and the colour scheme its node's design picks.
 */
export function blockRoot(
  props: { id: string; puck?: unknown },
  key: string,
  classNames: Array<string | false | null | undefined> = []
): { attributes: BlockRootAttributes; context: SiteRenderContext } {
  const context = readRenderContext(props.puck);
  const side = asRecord(asRecord(props)?.[SIDE_MAP_PROP]);
  /* Its cell range in a free section: a node field, in the side map. */
  const place = placeClasses(side?.place);
  const className = ['hl-blk', `hl-blk-${key}`, ...classNames.filter(Boolean), ...place].join(' ');
  const scheme = schemeOf(props);
  /* Its `when`: the render pass left it in the side map only
     inside a scope, and marked it `off` while it is false. */
  const when = Array.isArray(side?.when) ? JSON.stringify(side.when) : undefined;
  return {
    attributes: {
      'data-hl-block': props.id,
      'data-hl-block-type': key,
      lang: context.locale,
      dir: context.dir,
      className,
      ...(scheme ? { 'data-hl-scheme': scheme } : {}),
      ...(when ? { 'data-hl-when': when } : {}),
      ...(when && side?.off === true ? { 'data-hl-off': '' as const } : {}),
    },
    context,
  };
}

/**
 * Marks the element showing a prop bound to a scope value (`{ $state }`), so
 * the scope runtime can patch its text: `data-hl-bind='{"p":"adults","f":"integer"}'`.
 * `name` is the prop path the render pass recorded (`text`, `items.0.value`).
 * The element must hold that text only. Never in the canvas, where no
 * runtime runs.
 */
export function bindAttr(props: { puck?: unknown }, name: string): { 'data-hl-bind'?: string } {
  if (readRenderContext(props.puck).mode === 'canvas') return {};
  const binds = asRecord(asRecord(asRecord(props)?.[SIDE_MAP_PROP])?.binds);
  const bind = asRecord(binds?.[name]);
  if (!bind || typeof bind.p !== 'string') return {};
  const f = typeof bind.f === 'string' ? bind.f : 'text';
  return { 'data-hl-bind': JSON.stringify({ p: bind.p, f }) };
}

/**
 * Marks the element that renders one editable prop, so the Design canvas
 * can turn a click on a title into "select this block and focus its `title`
 * field". Only while editing: the published site (`static`) ships no trace.
 */
export function fieldAttr(context: SiteRenderContext, name: string): { 'data-hl-field'?: string } {
  return context.mode === 'static' ? {} : { 'data-hl-field': name };
}

/**
 * Marks one item of a repeated prop (`buttons[1]`, `cards[0]`): what the
 * canvas's element bar duplicates, moves or deletes. A nested list keeps the
 * path (`groups[0].items[2]`). Static output ships nothing, as `fieldAttr`.
 */
export function itemAttr(
  context: SiteRenderContext,
  name: string,
  index: number
): { 'data-hl-field'?: string } {
  return fieldAttr(context, `${name}[${index}]`);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

/**
 * A bound prop's literal, or `fallback` while it is still a reference. A
 * `{ $state }` the render pass did not format (one outside any scope) is a
 * reference too.
 */
export function literal<T>(value: Bound<T> | StateRef | undefined, fallback: T): T {
  if (value === undefined || isSlotRef(value) || isRecordRef(value) || isStateRef(value)) {
    return fallback;
  }
  return value;
}

/**
 * A stored number → a CSS number. Block props are stored unvalidated
 * (`puckDataSchema` keeps them `unknown`), and `String('3;position:fixed')`
 * in an inline `style` is a second declaration — so anything that is not a
 * finite number is `undefined`, which `styleVars` drops.
 */
export function cssNumber(value: unknown, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.min(Math.max(0, Math.round(value)), max);
}

/**
 * A plain object of custom-property values → an inline `style`, dropping
 * `undefined` entries so an unset prop falls through to `site.css`'s own
 * `var(..., fallback)` chain rather than writing an empty custom property.
 */
export function styleVars(vars: Record<string, string | number | undefined>): CSSProperties {
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined) style[key] = String(value);
  }
  return style as CSSProperties;
}

/**
 * A legacy theme role still has its own dedicated CSS variable
 * (`--site-accent`, `--site-paper`, `--site-ink`, `--site-heading-font`) from
 * before the theme became an array of roles; the generic per-role variable
 * (`--site-color-<role>`, `--site-font-<role>`) is preferred once the theme
 * emits it, with the legacy name as a fallback so nothing regresses in the
 * meantime.
 */
const LEGACY_COLOR_VAR: Record<string, string> = {
  accent: '--site-accent',
  paper: '--site-paper',
  ink: '--site-ink',
};
const LEGACY_FONT_VAR: Record<string, string> = {
  heading: '--site-heading-font',
};

/**
 * Block props reach a component as stored — `puckDataSchema` keeps them as
 * `unknown`, so `colorPropSchema` / `fontPropSchema` never ran on them. What
 * these two resolvers return is written into an inline `style`, where a `;`
 * starts a new declaration: anything that is not exactly a hex, a role key or
 * a family name resolves to the fallback instead of being interpolated.
 */
/** A `colorPropSchema` value → a CSS `<color>`, resolved against the theme. */
export function resolveColorValue(value: ColorValue | undefined, fallbackVarName: string): string {
  const stored = asRecord(value);
  if (!stored) return `var(${fallbackVarName})`;
  if (isHexColour(stored.custom)) return stored.custom;
  if (!isThemeRoleKey(stored.role)) return `var(${fallbackVarName})`;
  const role = stored.role;
  const roleVar = `--site-color-${role}`;
  const legacy = LEGACY_COLOR_VAR[role];
  return legacy
    ? `var(${roleVar}, var(${legacy}, var(${fallbackVarName})))`
    : `var(${roleVar}, var(${fallbackVarName}))`;
}

/** A `fontPropSchema` value → a CSS `font-family` value, resolved against the theme. */
export function resolveFontValue(value: FontValue | undefined, fallbackVarName: string): string {
  const stored = asRecord(value);
  if (!stored) return `var(${fallbackVarName})`;
  if (isFontFamilyName(stored.family)) return `'${stored.family}', var(${fallbackVarName})`;
  if (!isThemeRoleKey(stored.role)) return `var(${fallbackVarName})`;
  const role = stored.role;
  const roleVar = `--site-font-${role}`;
  const legacy = LEGACY_FONT_VAR[role];
  return legacy
    ? `var(${roleVar}, var(${legacy}, var(${fallbackVarName})))`
    : `var(${roleVar}, var(${fallbackVarName}))`;
}

export function literalMedia(value: unknown): ResolvedMedia | null {
  return isResolvedMedia(value) ? value : null;
}

export function collectionOf(value: CollectionRef | ResolvedCollection | null | undefined) {
  return isResolvedCollection(value) ? value : null;
}

function readString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

/** `/rooms/{slug}` → `/rooms/suite-jasmin`; unknown fields become empty. */
export function fillHrefTemplate(template: string, record: ResolvedRecord): string | undefined {
  if (!template) return undefined;
  return template.replace(/\{(\w+)\}/g, (_, field: string) => {
    if (field === 'slug') return encodeURIComponent(record.slug ?? '');
    if (field === 'id') return encodeURIComponent(record.id);
    return encodeURIComponent(readString(record.data[field]));
  });
}

/**
 * A listing's cards. A card links to the record's own page (`record.href`,
 * computed by the resolver from the collection's template page — CB-h), and
 * falls back to the block's `hrefTemplate` when the collection has none.
 */
export function toListingItems(
  collection: ResolvedCollection,
  mapping: ListingMapping,
  limit: number,
  locale: string
): ListingItem[] {
  /* A money price prints in the page's locale; a number stays as typed. */
  const readPrice = (value: unknown) =>
    isMoneyValue(value) ? formatMoney(value, locale) : readString(value);
  /* A phone reads grouped, a country by name — where the fields are known
     (a live list's runtime read carries none, and prints them raw). */
  const typeOf = new Map(collection.fields.map((field) => [field.key, field.type]));
  const readText = (record: ResolvedRecord, key: string) => {
    const value = record.data[key];
    if (typeof value === 'string' && typeOf.get(key) === 'phone') return formatPhone(value);
    if (typeof value === 'string' && typeOf.get(key) === 'country') {
      return countryName(value, locale);
    }
    return readString(value);
  };
  return collection.records.slice(0, limit).map((record) => ({
    id: record.id,
    title: readText(record, mapping.titleField),
    meta: readText(record, mapping.metaField),
    price: readPrice(record.data[mapping.priceField]),
    image: literalMedia(record.data[mapping.imageField]),
    href: record.href ?? fillHrefTemplate(mapping.hrefTemplate, record),
  }));
}

/**
 * A stored style (`styleSchema`) → the element's utilities and the inline
 * variables its colour / font utilities read. Breakpoint values map through
 * the vocabulary (`styleClasses`); colours and the font resolve against the
 * theme like every other colour / font prop, each behind one fixed utility
 * that reads a variable set on the element itself — so nothing inherits into
 * a nested element that did not ask for it.
 */
export function boxStyle(
  raw: unknown,
  levels: FontLevels = NO_LEVELS
): {
  classes: string[];
  vars: Record<string, string | undefined>;
  /** The style picks a font (a level or a family): the block's default level no longer applies. */
  font?: boolean;
  /** Its motion, as the `data-hl-motion` value (M47, `motion/compile.ts`). */
  motion?: string;
} {
  const stored = asRecord(raw) ?? {};
  const classes = styleClasses(stored);
  const vars: Record<string, string | undefined> = {};
  /* The canvas handles' free size and rotation, where the element has one. */
  const frame = frameStyle(stored);
  classes.push(...frame.classes);
  Object.assign(vars, frame.vars);
  if (asRecord(stored.background)) {
    vars['--s-bg'] = resolveColorValue(stored.background as ColorValue, '--site-paper');
    classes.push('bg-(--s-bg)');
  }
  if (asRecord(stored.borderColor)) {
    vars['--s-bd'] = resolveColorValue(stored.borderColor as ColorValue, '--site-hairline');
    classes.push('border-(--s-bd)');
  }
  if (asRecord(stored.color)) {
    vars['--s-fg'] = resolveColorValue(stored.color as ColorValue, '--site-ink');
    classes.push('text-(--s-fg)');
  }
  if (asRecord(stored.font)) {
    vars['--s-font'] = resolveFontValue(stored.font as FontValue, '--site-body-font');
    classes.push('font-(family-name:--s-font)');
  }
  /* A surface: its layers as one `background-image` in a variable. */
  if (hasSurface(stored)) {
    const surface = asRecord(stored.surface) ?? {};
    vars['--s-bgi'] = surfaceImage(surface);
    const position = asRecord(stored.surface)?.position;
    vars['--s-bgp'] =
      SURFACE_POSITION_CSS[
        (typeof position === 'string' && position in SURFACE_POSITION_CSS
          ? position
          : 'center') as keyof typeof SURFACE_POSITION_CSS
      ];
    classes.push(...surfaceClasses(stored));
  }
  /* Motion: the attribute the M47 runtime plays (`motion/runtime.ts`). */
  const motion = motionAttribute(stored.motion);
  /* Free utilities last: a `pt-[72px]` replaces the token's padding
     through `mergeClasses`, and anything unsafe was dropped by the sanitiser. */
  classes.push(...sanitiseClasses(stored.classes));
  const font = asRecord(stored.font);
  if (!font) return { classes, vars, ...(motion ? { motion } : {}) };
  /* A level's weight, size and spacing sit under the style's own: a weight
     set on this element replaces the level's (`mergeClasses`). */
  const level = isThemeRoleKey(font.role) ? levelStyle(font.role, levels) : NO_STYLE;
  return {
    classes: mergeClasses(level.classes.join(' '), classes),
    vars: { ...level.vars, ...vars },
    font: true,
    ...(motion ? { motion } : {}),
  };
}

/* -------------------------------------------------------------------------- */
/*                                 FONT LEVELS                                */
/* -------------------------------------------------------------------------- */

type TypographyKey = keyof SiteThemeTypography;

/** Which typography each of the theme's font levels sets, by level key. */
export type FontLevels = ReadonlyMap<string, ReadonlySet<TypographyKey>>;

const NO_LEVELS: FontLevels = new Map();
const levelsCache = new WeakMap<object, FontLevels>();

/**
 * The utility and the variable each typography value goes through. The
 * utilities are fixed strings (Tailwind scans this file); the variable points
 * at the one `themeToCss` writes for the level, so the value is the theme's.
 * Tracking is Latin-only, like every block's own (`rtl:tracking-normal`).
 */
const LEVEL_UTILITIES: Record<TypographyKey, { suffix: string; prop: string; classes: string[] }> =
  {
    weight: { suffix: 'weight', prop: '--s-fw', classes: ['font-(--s-fw)'] },
    size: { suffix: 'size', prop: '--s-fs', classes: ['text-(length:--s-fs)'] },
    lineHeight: { suffix: 'leading', prop: '--s-lh', classes: ['leading-(--s-lh)'] },
    letterSpacing: {
      suffix: 'tracking',
      prop: '--s-ls',
      classes: ['tracking-(--s-ls)', 'rtl:tracking-normal'],
    },
  };

/**
 * The theme's font levels as Puck metadata carries them (`hlTheme`), reduced
 * to what each sets — read without the schema, once per theme object: only a
 * level's key and the presence of a number matter here, and both are checked.
 */
export function readFontLevels(puck: unknown): FontLevels {
  const metadata = asRecord(asRecord(puck)?.metadata);
  const theme = asRecord(metadata?.[THEME_METADATA_KEY]);
  if (!theme || !Array.isArray(theme.fonts)) return NO_LEVELS;
  const cached = levelsCache.get(theme.fonts);
  if (cached) return cached;
  const levels = new Map<string, Set<TypographyKey>>();
  for (const entry of theme.fonts) {
    const role = asRecord(entry);
    if (!role || !isThemeRoleKey(role.key)) continue;
    const set = new Set(SITE_THEME_TYPOGRAPHY_KEYS.filter((key) => typeof role[key] === 'number'));
    if (set.size > 0) levels.set(role.key, set);
  }
  levelsCache.set(theme.fonts, levels);
  return levels;
}

/** The utilities and variables that apply level `key`'s typography — only what it sets. */
function levelStyle(key: string, levels: FontLevels): ReturnType<typeof boxStyle> {
  const set = levels.get(key);
  if (!set) return NO_STYLE;
  const classes: string[] = [];
  const vars: Record<string, string> = {};
  for (const name of set) {
    const utility = LEVEL_UTILITIES[name];
    classes.push(...utility.classes);
    vars[utility.prop] = `var(--site-font-${key}-${utility.suffix})`;
  }
  return { classes, vars };
}

/** A default that sets the heading font (`font-heading`) draws the heading level. */
const HEADING_DEFAULT = /(?:^|\s)font-heading(?:\s|$)/;

/** A URL a surface may point at: this app's media, a build's `/media/`, or a plain https address. */
const SURFACE_URL = /^(https:\/\/[^\s"'()<>]+|\/[^\s"'()<>]*)$/;

/**
 * The layers of a surface, top first, as one CSS `background-image` list:
 * the colour overlay (a flat gradient), the gradient, then the image. Every
 * colour resolves through `resolveColorValue`, every URL is checked — the
 * value lands in an inline style where a `)` or a `;` would start a new
 * declaration.
 */
function surfaceImage(surface: Record<string, unknown>): string {
  const layers: string[] = [];
  const overlay = asRecord(surface.overlay);
  if (overlay && asRecord(overlay.color)) {
    const colour = resolveColorValue(overlay.color as ColorValue, '--site-ink');
    const opacity =
      typeof overlay.opacity === 'number' ? Math.max(0, Math.min(100, overlay.opacity)) : 50;
    const wash = `color-mix(in srgb, ${colour} ${opacity}%, transparent)`;
    layers.push(`linear-gradient(${wash}, ${wash})`);
  }
  const gradient = asRecord(surface.gradient);
  if (gradient && asRecord(gradient.from)) {
    const from = resolveColorValue(gradient.from as ColorValue, '--site-accent');
    const to = asRecord(gradient.to)
      ? resolveColorValue(gradient.to as ColorValue, '--site-paper')
      : 'transparent';
    const via = asRecord(gradient.via)
      ? `, ${resolveColorValue(gradient.via as ColorValue, '--site-paper')}`
      : '';
    const angle =
      typeof gradient.angle === 'number'
        ? Math.max(0, Math.min(360, Math.round(gradient.angle)))
        : 180;
    layers.push(`linear-gradient(${angle}deg, ${from}${via}, ${to})`);
  }
  const image = asRecord(surface.image);
  if (image && isResolvedMedia(image) && SURFACE_URL.test(image.url)) {
    /* The rungs: `image-set()` lets a dense screen take the larger
       one. Every URL is checked like the original's. */
    const urls = surfaceImageUrls(image).filter((url) => SURFACE_URL.test(url));
    const first = urls[0] ?? image.url;
    layers.push(
      urls.length > 1
        ? `image-set(${urls.map((url, index) => `url("${url}") ${index + 1}x`).join(', ')})`
        : `url("${first}")`
    );
  }
  return layers.length > 0 ? layers.join(', ') : 'none';
}

/* -------------------------------------------------------------------------- */
/*                                    ICONS                                   */
/* -------------------------------------------------------------------------- */

/** How a block reads an `iconSchema` value: a named glyph, a media asset, or text. */
export function readIcon(
  value: unknown
):
  | { kind: 'name'; name: IconName }
  | { kind: 'media'; media: ResolvedMedia }
  | { kind: 'glyph'; glyph: string }
  | null {
  const icon = asRecord(value);
  if (!icon) {
    /* A bare string: an icon name, or a glyph (the old `featureGrid.icon`). */
    if (typeof value === 'string' && value.trim()) {
      return isIconName(value) ? { kind: 'name', name: value } : { kind: 'glyph', glyph: value };
    }
    return null;
  }
  if (isIconName(icon.name)) return { kind: 'name', name: icon.name };
  if (isResolvedMedia(icon.media)) return { kind: 'media', media: icon.media };
  if (typeof icon.glyph === 'string' && icon.glyph.trim())
    return { kind: 'glyph', glyph: icon.glyph };
  if (typeof icon.name === 'string' && icon.name.trim()) return { kind: 'glyph', glyph: icon.name };
  return null;
}

/**
 * An icon as a block draws it: the set's SVG in the current colour, a
 * media asset at the same size, or a glyph. `className` sizes it (`size-6`).
 */
export function Icon({
  icon,
  className = 'size-6',
  title,
}: {
  icon: unknown;
  className?: string;
  title?: string;
}): ReactElement | null {
  const read = readIcon(icon);
  if (!read) return null;
  if (read.kind === 'name') {
    return (
      <svg
        className={cx('shrink-0 fill-current', className)}
        viewBox="0 0 256 256"
        aria-hidden={title ? undefined : 'true'}
        role={title ? 'img' : undefined}
      >
        {title ? <title>{title}</title> : null}
        {ICON_PATHS[read.name]?.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </svg>
    );
  }
  if (read.kind === 'media') {
    return (
      <MediaImg
        className={cx('shrink-0 object-contain', className)}
        media={read.media}
        alt={title ?? read.media.alt ?? ''}
        sizes={MEDIA_SIZES_ATTR.icon}
      />
    );
  }
  return (
    <span
      className={cx('inline-grid shrink-0 place-items-center leading-none', className)}
      aria-hidden="true"
    >
      {read.glyph}
    </span>
  );
}

export type Styled = {
  className: string;
  style?: CSSProperties;
  /** The element's motion (M47): the last style that sets one wins. */
  'data-hl-motion'?: string;
};

const NO_STYLE = { classes: [] as string[], vars: {} as Record<string, string | undefined> };

/**
 * An element's default utilities, merged with its stored styles: every default
 * a style replaces is dropped (`mergeClasses`), the style's own utilities
 * are added, and its colour / font variables go inline. What every styleable
 * element of every block spreads. Several styles layer in order — a later
 * one (an item's own) replaces what an earlier one (its group's) set.
 */
export function styled(defaults: string, ...boxes: Array<ReturnType<typeof boxStyle>>): Styled {
  return styledWith(NO_LEVELS, defaults, boxes);
}

/**
 * `styled`, knowing the theme's font levels: an element whose defaults set the
 * heading font takes the heading level's weight, size and spacing over the
 * block's own — unless a style of its own picks another font.
 */
function styledWith(
  levels: FontLevels,
  defaults: string,
  boxes: Array<ReturnType<typeof boxStyle>>
): Styled {
  let classes = defaults;
  let merged: Record<string, string | undefined> = {};
  let motion: string | undefined;
  const heading =
    HEADING_DEFAULT.test(defaults) && !boxes.some((box) => box.font)
      ? [levelStyle('heading', levels)]
      : [];
  const layers = [...heading, ...boxes];
  for (const box of layers.length > 0 ? layers : [NO_STYLE]) {
    classes = mergeClasses(classes, box.classes).join(' ');
    merged = { ...merged, ...box.vars };
    const own = (box as { motion?: string }).motion;
    if (own) motion = own;
  }
  const vars = styleVars(merged);
  return {
    className: classes,
    ...(Object.keys(vars).length > 0 ? { style: vars } : {}),
    ...(motion ? { 'data-hl-motion': motion } : {}),
  };
}

/**
 * Everything a block needs to render its root and its styleable elements:
 *
 * - `root` — the block attributes (`blockRoot`) with the block's own `style`
 *   merged over `rootDefaults`; spread it on the root element.
 * - `el(name, defaults)` — the element named `name` (its `data-hl-field`,
 *   and its entry in `props.elements`), its defaults merged with that entry.
 *   Spread it on the element; it carries the canvas marker too.
 * - `item(path, index, value, defaults, group)` — one item of a repeated prop
 *   (`buttons[1]`): its defaults, then the `group` element's entry when the
 *   block styles every item through one (`items`), then the item's own
 *   `style` — stored on the item, so it moves and duplicates with it. Carries
 *   the item's canvas marker (`itemAttr`).
 *
 * Defaults are plain Tailwind — what a developer reads in the component —
 * and a designer's style always replaces the default for the same property.
 */
export function blockParts(
  props: { id: string; puck?: unknown; style?: unknown; elements?: unknown },
  key: string,
  rootDefaults = ''
): {
  root: BlockRootAttributes & { style?: CSSProperties };
  context: SiteRenderContext;
  el: (name: string, defaults?: string) => Styled & { 'data-hl-field'?: string };
  box: (name: string, defaults?: string) => Styled;
  item: (
    path: string,
    index: number,
    value: unknown,
    defaults?: string,
    group?: string
  ) => Styled & { 'data-hl-field'?: string };
} {
  const { attributes, context } = blockRoot(props, key);
  const levels = readFontLevels(props.puck);
  const own = styledWith(levels, rootDefaults, [boxStyle(props.style, levels)]);
  const elements = asRecord(props.elements);
  const box = (name: string, defaults = '') =>
    styledWith(levels, defaults, [boxStyle(elements?.[name], levels)]);
  return {
    root: {
      ...attributes,
      className: [attributes.className, own.className].filter(Boolean).join(' '),
      ...(own.style ? { style: own.style } : {}),
      ...(own['data-hl-motion'] ? { 'data-hl-motion': own['data-hl-motion'] } : {}),
    },
    context,
    el: (name, defaults = '') => ({ ...box(name, defaults), ...fieldAttr(context, name) }),
    box,
    item: (path, index, value, defaults = '', group) => ({
      ...styledWith(levels, defaults, [
        ...(group ? [boxStyle(elements?.[group], levels)] : []),
        boxStyle(asRecord(value)?.style, levels),
      ]),
      ...itemAttr(context, path, index),
    }),
  };
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Whether a block is above the fold: the first
 * node of the page and the first-child chain inside it (`SiteRender`'s
 * `leadBlocks`). Its first media is fetched eagerly with high priority.
 */
export function isLeadBlock(context: SiteRenderContext, id: string): boolean {
  return context.leadBlocks?.includes(id) ?? false;
}

/**
 * One media value as an `<img>` (`mediaImgAttrs`): its rungs as a `srcset`,
 * the chosen rung, or the original; lazy unless `priority`. A GIF served
 * animated sits in a `<picture>` whose reduced-motion source is its still
 * `poster` — the picture is `display: contents`, so the image lays out as if
 * it were the parent's own child.
 */
export function MediaImg({
  media,
  className,
  alt,
  sizes,
  priority,
  eager,
  style,
  field,
}: {
  media: ResolvedMedia;
  className?: string;
  /** Overrides the value's own alt (an empty string is a decorative image). */
  alt?: string;
  sizes?: string;
  priority?: boolean;
  /** Not lazy, without asking for priority (a header logo). */
  eager?: boolean;
  style?: CSSProperties;
  /** The editable-prop marker (`fieldAttr`), when the image IS a prop. */
  field?: { 'data-hl-field'?: string };
}): ReactElement {
  const { reducedMotionSrc, ...attrs } = mediaImgAttrs(media, { sizes, priority, eager });
  const img = (
    <img className={className} style={style} alt={alt ?? media.alt ?? ''} {...attrs} {...field} />
  );
  if (!reducedMotionSrc) return img;
  return (
    <picture className="contents">
      <source media="(prefers-reduced-motion: reduce)" srcSet={reducedMotionSrc} />
      {img}
    </picture>
  );
}

export function MediaFigure({
  media,
  className,
  placeholder,
  sizes,
  priority,
  field,
  style,
  motion,
}: {
  media: ResolvedMedia | null;
  /** Utilities that replace or extend the figure's defaults (`mergeClasses`). */
  className?: string;
  placeholder?: string;
  /** How wide it is drawn (`MEDIA_SIZES_ATTR`); the content column by default. */
  sizes?: string;
  /** Above the fold: eager, `fetchpriority="high"`. */
  priority?: boolean;
  /** The editable-prop marker (`fieldAttr`), when this figure IS a prop. */
  field?: { 'data-hl-field'?: string };
  /** Inline variables of the figure's own style (`boxStyle`). */
  style?: CSSProperties;
  /** The figure's own motion (`Styled['data-hl-motion']`), played by the M47 runtime. */
  motion?: string;
}): ReactElement {
  const classes = mergeClasses(
    'relative overflow-hidden rounded-site bg-site-media-fill',
    className ? className.split(' ') : []
  ).join(' ');
  return (
    <div
      className={classes}
      style={style}
      {...field}
      {...(motion ? { 'data-hl-motion': motion } : {})}
    >
      {media ? (
        <MediaImg
          className="size-full object-cover"
          media={media}
          sizes={sizes ?? MEDIA_SIZES_ATTR.content}
          priority={priority}
        />
      ) : placeholder ? (
        <span
          className="absolute start-3 bottom-3 font-mono text-[10px] tracking-[0.06em] text-site-ink/40"
          aria-hidden="true"
        >
          {placeholder}
        </span>
      ) : null}
    </div>
  );
}

/** The button look, per variant — shared by every block that draws one. */
export const BUTTON_CLASSES =
  'inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-site border border-transparent px-4.25 py-2.25 font-[inherit] text-site-sm leading-[1.2] hover:no-underline hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55';

export type ButtonVariant = 'primary' | 'ghost' | 'paper' | 'ink' | 'outline' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'border-site-accent bg-site-accent text-site-on-accent',
  ghost: 'border-site-hairline-strong bg-transparent text-site-ink',
  paper: 'border-site-on-accent bg-site-on-accent text-site-accent',
  ink: 'border-site-ink bg-site-ink text-site-on-ink',
  outline: 'border-site-ink bg-transparent text-site-ink',
  link: 'border-transparent bg-transparent px-0 py-0 text-site-accent underline-offset-4 hover:underline hover:brightness-100',
};

/** The button's size: `md` is `BUTTON_CLASSES`' own padding and type. */
export const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-site-xs [&_svg]:size-3.5',
  md: '',
  lg: 'px-6 py-3 text-site-md [&_svg]:size-5',
};

/** The small uppercase line above a title. */
export const EYEBROW_CLASSES = 'mb-3.5 text-site-xs uppercase tracking-[0.14em] text-site-accent';

export function SiteButton({
  label,
  href,
  variant = 'primary',
  size,
  icon,
  iconPosition = 'end',
  className,
  field,
  style,
  action,
  inert = false,
  bind,
  motion,
}: {
  label: string;
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** An `iconSchema` value drawn beside the label. */
  icon?: unknown;
  iconPosition?: 'start' | 'end';
  /** Utilities that replace or extend the button's defaults (`mergeClasses`). */
  className?: string;
  field?: { 'data-hl-field'?: string };
  style?: CSSProperties;
  /**
   * A scope action: the button becomes a `<button
   * type="button" data-hl-action>` the scope runtime answers, and `href` is
   * ignored. Validated by the caller.
   */
  action?: unknown;
  /** The canvas: an action button is drawn, never armed. */
  inert?: boolean;
  /** `bindAttr` of a label bound to a scope value: the label sits in its own span. */
  bind?: { 'data-hl-bind'?: string };
  /** The button's own motion (`Styled['data-hl-motion']`), played by the M47 runtime. */
  motion?: string;
}): ReactElement {
  const moving = motion ? { 'data-hl-motion': motion } : {};
  const classes = mergeClasses(
    `${BUTTON_CLASSES} ${BUTTON_VARIANT_CLASSES[variant] ?? BUTTON_VARIANT_CLASSES.primary}`,
    [
      ...(size && BUTTON_SIZE_CLASSES[size] ? BUTTON_SIZE_CLASSES[size].split(' ') : []),
      ...(className ? className.split(' ') : []),
    ]
  ).join(' ');
  const glyph = icon ? <Icon icon={icon} className="size-4" /> : null;
  const content = (
    <>
      {iconPosition === 'start' ? glyph : null}
      {bind?.['data-hl-bind'] ? <span {...bind}>{label}</span> : label}
      {iconPosition === 'end' ? glyph : null}
    </>
  );
  if (action) {
    return (
      <button
        type="button"
        className={classes}
        style={style}
        {...field}
        {...moving}
        {...(inert ? { tabIndex: -1 } : { 'data-hl-action': JSON.stringify(action) })}
      >
        {content}
      </button>
    );
  }
  return href ? (
    <a className={classes} href={href} style={style} {...field} {...moving}>
      {content}
    </a>
  ) : (
    <span className={classes} aria-disabled="true" style={style} {...field} {...moving}>
      {content}
    </span>
  );
}

type SlotRender = (props: { className?: string; minEmptyHeight?: number }) => ReactNode;

/**
 * Where a layout block draws its slot. Puck hands a slot prop over as a
 * render function (a drop zone on the canvas, the nested blocks in static
 * output); anything else — a bare render with raw data — draws an empty
 * area, never the raw array.
 *
 * The function is CALLED, never mounted as `<Content />`: Puck builds a new
 * one on every render of the parent, and a new element type would remount
 * the whole nested subtree — a click on a nested block would then land on a
 * detached node. Called, it returns Puck's own drop-zone element, whose type
 * is stable, so React reconciles the children in place.
 */
export function SlotArea({
  slot,
  className,
  layout = 'grid content-start gap-[var(--site-slot-gap,18px)]',
}: {
  slot: unknown;
  className?: string;
  /** The slot's own layout utilities — a stack replaces the default grid with flex. */
  layout?: string;
}): ReactElement {
  /* `hl-slot` stays a marker: `site.css` drops the density padding of the
     blocks nested in it. */
  const classes = ['hl-slot', layout, className].filter(Boolean).join(' ');
  if (typeof slot !== 'function') return <div className={classes} />;
  return <>{(slot as SlotRender)({ className: classes, minEmptyHeight: 96 })}</>;
}

/**
 * A block's floating layer: its free elements (`floating` blocks), laid over
 * the whole block. The layer itself lets clicks through to the block below;
 * each free element takes them back. Drawn through the slot function like
 * `SlotArea` (never mounted), with no minimum height — an empty layer must
 * not push the block's layout.
 */
export function FloatingLayer({ slot }: { slot: unknown }): ReactElement | null {
  const classes = 'hl-float-layer pointer-events-none absolute inset-0 z-10 *:pointer-events-auto';
  if (typeof slot !== 'function') return null;
  return <>{(slot as SlotRender)({ className: classes, minEmptyHeight: 0 })}</>;
}

/** The `DB rooms` chip the canvas shows on a collection-bound block. */
export function BindBadge({ children }: { children: ReactNode }): ReactElement {
  return (
    <span className="inline-flex items-center gap-1.25 rounded-site-pill border border-dashed border-site-accent/50 bg-site-accent-soft px-2 py-0.75 font-mono text-site-xs text-site-accent">
      {children}
    </span>
  );
}
