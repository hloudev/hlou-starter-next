/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { colorPropSchema, styleProps } from '../style-props';

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const SHAPE_KINDS = [
  'ellipse',
  'circle',
  'line',
  'underline',
  'scribble',
  'arrow',
  'star',
  'blob',
  'rect',
] as const;

/**
 * A decoration: a hand-drawn ellipse, a scribble, an arrow, a blob, a
 * rule — the marks designers scatter over a page. An inline SVG that
 * stretches to the block's size; placed in flow, or over another block as a
 * free element (a `floating` block holding it). A hero's hand-drawn circle
 * once took four turns of code; this is a prop.
 */
export const shapeSchema = z.object({
  kind: z.enum(SHAPE_KINDS),
  stroke: colorPropSchema(),
  strokeWidth: z.number().int().min(0).max(16),
  /** Filled when set; stroke only otherwise. */
  fill: colorPropSchema().optional(),
  /** Slightly irregular path, as if drawn by hand. */
  handDrawn: z.boolean(),
  /** The box, in px. */
  width: z.number().int().min(8).max(1600),
  height: z.number().int().min(4).max(1600),
  rotate: z.number().int().min(-180).max(180),
  ...styleProps([]),
});
export type ShapeProps = z.infer<typeof shapeSchema>;
