/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { DocNode, PageDocument } from './schema';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMAS                                  */
/* -------------------------------------------------------------------------- */

/**
 * What one instance changes on one of its component's nodes, kept
 * on the instance as `overrides[nodeId]`:
 *
 * - `props`: top-level props, each replacing the component's whole;
 * - `style`: the block's `style` prop by element (`text`, `accent` …), each
 *   element replacing the component's;
 * - `design`: design options (`scheme`, `spacing` …) by key.
 *
 * Whatever an instance does not override follows the component, so an edit
 * of the source reaches every instance except where one set its own value.
 */
export const instanceOverrideSchema = z.object({
  props: z.record(z.string(), z.unknown()).optional(),
  style: z.record(z.string(), z.unknown()).optional(),
  design: z.record(z.string(), z.string()).optional(),
});
export type InstanceOverride = z.infer<typeof instanceOverrideSchema>;

/** The parts of an override, in the order an inspector lists them. */
export const OVERRIDE_PARTS = ['props', 'style', 'design'] as const;
export type OverridePart = (typeof OVERRIDE_PARTS)[number];

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** An override as stored, read leniently: a part that is not a record is ignored. */
export function readOverride(raw: unknown): InstanceOverride {
  if (!isRecord(raw)) return {};
  const out: InstanceOverride = {};
  if (isRecord(raw.props) && Object.keys(raw.props).length > 0) out.props = raw.props;
  if (isRecord(raw.style) && Object.keys(raw.style).length > 0) out.style = raw.style;
  if (isRecord(raw.design)) {
    const design = Object.fromEntries(
      Object.entries(raw.design).filter((entry): entry is [string, string] => {
        return typeof entry[1] === 'string';
      })
    );
    if (Object.keys(design).length > 0) out.design = design;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** One component node as an instance shows it. */
export function overriddenNode(node: DocNode, raw: unknown): DocNode {
  const override = readOverride(raw);
  if (!override.props && !override.style && !override.design) return node;
  const props: Record<string, unknown> = { ...node.props, ...override.props };
  if (override.style) {
    const style = isRecord(props.style) ? props.style : {};
    props.style = { ...style, ...override.style };
  }
  return {
    ...node,
    props,
    ...(override.design ? { design: { ...node.design, ...override.design } } : {}),
  };
}

/**
 * A component's document as one instance draws it: every node it overrides
 * patched (`overriddenNode`), the rest the component's own objects. An
 * override naming a node the component no longer has is ignored, so
 * deleting a block in the source never breaks an instance.
 */
export function applyOverrides(
  doc: PageDocument,
  overrides: Record<string, unknown> | undefined
): PageDocument {
  if (!overrides) return doc;
  let nodes: Record<string, DocNode> | null = null;
  for (const [id, raw] of Object.entries(overrides)) {
    const node = doc.nodes[id];
    if (!node) continue;
    const next = overriddenNode(node, raw);
    if (next === node) continue;
    (nodes ??= { ...doc.nodes })[id] = next;
  }
  return nodes ? { ...doc, nodes } : doc;
}
