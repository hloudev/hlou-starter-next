/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import {
  PLACE_COLUMN_MAX,
  PLACE_ROTATION_MAX,
  PLACE_ROW_MAX,
  PLACE_ROW_SPAN_MAX,
  PLACE_Z_MAX,
} from '../blocks/tw';
import { whenSchema } from '../state/condition';

/* -------------------------------------------------------------------------- */
/*                                 DOCUMENT V2                                */
/* -------------------------------------------------------------------------- */

/** The root node's type. Every document has exactly one. */
export const ROOT_NODE_TYPE = 'root';
/** A placed component (Header, Footer, a saved section): `instanceOf` names it. */
export const INSTANCE_NODE_TYPE = 'instance';
/** The slot the root's children sit in — Puck's `content`. */
export const ROOT_SLOT = 'content';

/** One breakpoint's cell range in a free section (`blocks/tw.ts`'s `PlaceValue`). */
export const docPlaceValueSchema = z.object({
  colStart: z.number().int().min(1).max(PLACE_COLUMN_MAX),
  colSpan: z.number().int().min(1).max(PLACE_COLUMN_MAX),
  rowStart: z.number().int().min(1).max(PLACE_ROW_MAX),
  rowSpan: z.number().int().min(1).max(PLACE_ROW_SPAN_MAX),
  z: z.number().int().min(0).max(PLACE_Z_MAX).optional(),
  rotate: z.number().int().min(-PLACE_ROTATION_MAX).max(PLACE_ROTATION_MAX).optional(),
});

/** Where a free section's child sits, per breakpoint; any of them may be missing. */
export const docPlaceSchema = z.object({
  base: docPlaceValueSchema.optional(),
  md: docPlaceValueSchema.optional(),
  lg: docPlaceValueSchema.optional(),
  xl: docPlaceValueSchema.optional(),
});
export type DocPlace = z.infer<typeof docPlaceSchema>;

/**
 * One block of a page, flat: its place is `parent` + `slot` + `order`, never
 * a nesting. `id` is the block's Puck `props.id` — proofing pins,
 * `data-hl-block`, agent highlights and code anchors all name it.
 */
export const docNodeSchema = z.object({
  id: z.string().min(1),
  /** A block registry key, `root`, or `instance`. */
  type: z.string().min(1),
  /** `null` only for the root. */
  parent: z.string().nullable(),
  /** The parent's slot prop name (`content`, `floating`, `column1` …). */
  slot: z.string(),
  /** A fractional index; siblings sort by plain string comparison. */
  order: z.string(),
  /** The block's props without `id` and without its slot props (an empty slot may stay as `[]`). */
  props: z.record(z.string(), z.unknown()),
  /** The layer name. */
  name: z.string().optional(),
  /** The section role (`hero`, `features` …) . */
  role: z.string().optional(),
  /**
   * The Structure section (`page_sections.id`) this node is — set on a root
   * `section` node planned in Structure. Its label is `name`, its
   * pattern `props.glyph`; with no children yet it draws as the planned
   * section, never on a published site.
   */
  section: z.string().optional(),
  variant: z.string().optional(),
  design: z.record(z.string(), z.string()).optional(),
  /** The component an `instance` node draws. */
  instanceOf: z.string().optional(),
  /** Per-node prop overrides inside an instance. */
  overrides: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
  /**
   * Its cell range in a free section's grid, per breakpoint. Read by
   * the block through its side map; drawn only while its parent is free.
   */
  place: docPlaceSchema.optional(),
  /** Today's `_hidden`: kept in the document, never rendered. */
  hidden: z.boolean().optional(),
  /**
   * When it shows, against the nearest scope's state: always
   * rendered, marked `data-hl-off` while false. Paths name field keys, never
   * node ids. Outside any scope it is ignored.
   */
  when: whenSchema.optional(),
});
export type DocNode = z.infer<typeof docNodeSchema>;

export const pageDocumentSchema = z.object({
  /** The root node's id. */
  root: z.string().min(1),
  /** Puck's `root.props`, which `root.render` receives. */
  rootProps: z.record(z.string(), z.unknown()),
  nodes: z.record(z.string(), docNodeSchema),
});
export type PageDocument = z.infer<typeof pageDocumentSchema>;

export const siteComponentKindSchema = z.enum(['header', 'footer', 'section']);
export type SiteComponentKind = z.infer<typeof siteComponentKindSchema>;

/** A document placed by reference: today Header and Footer, later a saved section. */
export const siteComponentSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  name: z.string(),
  kind: siteComponentKindSchema,
  doc: pageDocumentSchema,
});
export type SiteComponent = z.infer<typeof siteComponentSchema>;
