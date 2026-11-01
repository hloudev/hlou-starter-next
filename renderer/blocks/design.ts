/* -------------------------------------------------------------------------- */
/*                                   PURPOSE                                  */
/* -------------------------------------------------------------------------- */

/**
 * Applies a node's variant and design choices (M33-13) when its block
 * renders, with one precedence everywhere — Puck (Classic, Focus), `renderDoc`
 * (Studio, previews, published sites):
 *
 *   variant defaults  <  design option  <  the node's explicit style (Fine-tune)
 *
 * A variant's props are a preset WRITTEN into the node when it is picked
 * (`variantPreset`), so they are the node's own props here; what it adds at
 * render time is its default design choices and its style layer. A design
 * choice may set props (a column count) and style (section padding). The
 * result is the typed values a block already reads, so every class stays in
 * the vocabulary — and `siteBuildClasses` lets a published site's CSS see it.
 */

import type { BlockVariant, DesignChoice, DesignLayer, SectionRole } from './design-options';
import type { BlockKey } from './index';
import type { BoxStyle } from './style-props';
import { readNodeDesign, SCHEME_DESIGN_KEY, SCHEME_KEY_PATTERN } from './design-options';
import { BLOCK_KEYS, blockRegistry, isBlockKey } from './index';
import { siteStyleClasses } from './tw';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

type Props = Record<string, unknown>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Later wins, key by key, objects deeply; free utilities add up instead. */
function mergeInto(target: Props, layer: Props): Props {
  const out: Props = { ...target };
  for (const [key, value] of Object.entries(layer)) {
    if (value === undefined) continue;
    const before = out[key];
    if (key === 'classes' && typeof value === 'string' && typeof before === 'string') {
      out[key] = `${before} ${value}`.trim();
    } else if (asRecord(value) && asRecord(before)) {
      out[key] = mergeInto(before as Props, value as Props);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Style layers merged in order, the last one winning; `undefined` when none says anything. */
export function mergeStyles(...layers: Array<unknown>): BoxStyle | undefined {
  let merged: Props | undefined;
  for (const layer of layers) {
    const record = asRecord(layer);
    if (!record || Object.keys(record).length === 0) continue;
    merged = merged ? mergeInto(merged, record) : { ...record };
  }
  return merged as BoxStyle | undefined;
}

function definitionOf(type: string) {
  return isBlockKey(type) ? blockRegistry[type] : undefined;
}

/* -------------------------------------------------------------------------- */
/*                                   LOOKUPS                                  */
/* -------------------------------------------------------------------------- */

/** The role a block type plays as a section, when it is a library block. */
export function blockRole(type: string): SectionRole | undefined {
  return definitionOf(type)?.role;
}

/** A node's role: its own (a Structure section's), else its block's. */
export function nodeRole(node: { type: string; role?: string }): string | undefined {
  return node.role ?? blockRole(node.type);
}

export function blockVariants(type: string): BlockVariant<Props>[] {
  return (definitionOf(type)?.variants ?? []) as BlockVariant<Props>[];
}

export function findVariant(
  type: string,
  key: string | undefined
): BlockVariant<Props> | undefined {
  return key ? blockVariants(type).find((variant) => variant.key === key) : undefined;
}

export function blockDesignOptions(type: string) {
  return definitionOf(type)?.designOptions ?? [];
}

/**
 * The wireframe glyph a node draws as (Wireframe, the Insert list): its
 * variant's, else its block's first variant's.
 */
export function nodeThumbnail(node: { type: string; variant?: string }): string | undefined {
  return (findVariant(node.type, node.variant) ?? blockVariants(node.type)[0])?.thumbnail;
}

/** The props a variant presets — what picking it writes into the node. */
export function variantPreset(type: string, key: string): Props | undefined {
  const variant = findVariant(type, key);
  return variant ? { ...(variant.props ?? {}) } : undefined;
}

/** Every library block that plays `role`, in palette order. */
export function blocksForRole(role: string): BlockKey[] {
  return BLOCK_KEYS.filter((key) => blockRegistry[key].role === role);
}

/* -------------------------------------------------------------------------- */
/*                                 VALIDATION                                 */
/* -------------------------------------------------------------------------- */

/**
 * Why a node of `type` cannot take these design choices, or `null`. A key is
 * one of the block's options (or `scheme`), a value one of its choices; a
 * scheme must be one of `schemes` (the theme's keys).
 */
export function designIssue(
  type: string,
  design: Record<string, string>,
  schemes: readonly string[]
): string | null {
  const options = blockDesignOptions(type);
  for (const [key, value] of Object.entries(design)) {
    if (key === SCHEME_DESIGN_KEY) {
      if (!SCHEME_KEY_PATTERN.test(value) || !schemes.includes(value)) {
        return schemes.length > 0
          ? `"${value}" is not a colour scheme of this theme: ${schemes.join(', ')}.`
          : `The theme has no colour schemes yet: add one with update_theme (upsertSchemes) first.`;
      }
      continue;
    }
    const option = options.find((candidate) => candidate.key === key);
    if (!option) {
      const known = [...options.map((candidate) => candidate.key), SCHEME_DESIGN_KEY];
      return `A ${type} block has no design option "${key}": ${known.join(', ')}.`;
    }
    if (!option.choices.some((choice) => choice.value === value)) {
      return `"${value}" is not a choice of ${type}.${key}: ${option.choices.map((choice) => choice.value).join(', ')}.`;
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*                                   APPLYING                                 */
/* -------------------------------------------------------------------------- */

/** The choices in effect: the variant's defaults under the node's own. */
function effectiveChoices(
  variant: BlockVariant<Props> | undefined,
  design: Record<string, string> | undefined
): Record<string, string> {
  return { ...(variant?.design ?? {}), ...(design ?? {}) };
}

function chosen(type: string, choices: Record<string, string>): DesignChoice<Props>[] {
  const out: DesignChoice<Props>[] = [];
  for (const option of blockDesignOptions(type)) {
    const value = choices[option.key];
    const choice = value === undefined ? undefined : option.choices.find((c) => c.value === value);
    if (choice) out.push(choice as DesignChoice<Props>);
  }
  return out;
}

/** The style layers a node's variant and choices add, lowest first. */
export function designLayers(
  type: string,
  side: { variant?: string; design?: Record<string, string> }
): DesignLayer[] {
  const variant = findVariant(type, side.variant);
  const layers: DesignLayer[] = [];
  if (variant && (variant.style || variant.elements)) layers.push(variant);
  for (const choice of chosen(type, effectiveChoices(variant, side.design))) {
    if (choice.style || choice.elements) layers.push(choice);
  }
  return layers;
}

/**
 * A block's props with its node's variant and design applied (see the top of
 * this file). Untouched — the same object — when the node has neither.
 */
export function applyDesign<P extends Props>(type: string, props: P): P {
  const side = readNodeDesign(props);
  if (!side.variant && !side.design) return props;
  const variant = findVariant(type, side.variant);
  const choices = chosen(type, effectiveChoices(variant, side.design));
  const layers = designLayers(type, side);
  if (choices.length === 0 && layers.length === 0) return props;

  let next: Props = { ...props };
  for (const choice of choices) {
    if (choice.props) next = { ...next, ...choice.props };
    if (choice.apply) next = { ...next, ...choice.apply(next) };
  }
  if (layers.length > 0) {
    const style = mergeStyles(...layers.map((layer) => layer.style), props.style);
    if (style) next.style = style;
    const names = new Set<string>();
    for (const layer of layers)
      Object.keys(layer.elements ?? {}).forEach((name) => names.add(name));
    if (names.size > 0) {
      const own = asRecord(props.elements) ?? {};
      const elements: Props = { ...own };
      for (const name of names) {
        elements[name] = mergeStyles(...layers.map((layer) => layer.elements?.[name]), own[name]);
      }
      next.elements = elements;
    }
  }
  return next as P;
}

/* -------------------------------------------------------------------------- */
/*                               A SITE'S CLASSES                             */
/* -------------------------------------------------------------------------- */

/**
 * The style layers every node of a tree (a snapshot, documents, Puck data)
 * gets from its variant and design: a document node carries `variant` /
 * `design` itself, a Puck item in its props' side map.
 */
export function designStyleTree(tree: unknown): DesignLayer[] {
  const found: DesignLayer[] = [];
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const record = asRecord(value);
    if (!record) return;
    if (typeof record.type === 'string' && asRecord(record.props)) {
      const own = readNodeDesign({ __hl: record });
      const side = own.variant || own.design ? own : readNodeDesign(record.props);
      if (side.variant || side.design) found.push(...designLayers(record.type, side));
    }
    Object.values(record).forEach(visit);
  };
  visit(tree);
  return found;
}

/**
 * `siteStyleClasses` with the design layer seen: what the builder writes to
 * `site/tw-classes.txt`, so a section's density or a variant's element style
 * ships in a published site's CSS like any stored style.
 */
export function siteBuildClasses(tree: unknown): string[] {
  const found = new Set(siteStyleClasses(tree));
  for (const cls of siteStyleClasses(designStyleTree(tree))) found.add(cls);
  return [...found].sort();
}
