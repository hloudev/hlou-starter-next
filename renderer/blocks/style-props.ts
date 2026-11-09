/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { BoundMeta, ResponsiveControl } from '../contracts';
import type { MotionSpec } from '../motion/schema';
import type { Responsive } from './tw';
import {
  ASPECT_RATIOS,
  BORDER_STYLES,
  BORDER_WIDTHS,
  CLASS_TOKEN_MAX,
  CLASS_TOKENS_MAX,
  classIssues,
  COL_SPANS,
  DECORATIONS,
  FRAME_ROTATION_MAX,
  FRAME_SIZE_MAX,
  LEADINGS,
  MARGIN_STEPS,
  MAX_WIDTHS,
  MIN_HEIGHTS,
  OPACITIES,
  OVERFLOWS,
  RADII,
  ROW_SPANS,
  SHADOWS,
  SPACE_STEPS,
  SURFACE_FITS,
  SURFACE_POSITIONS,
  TEXT_ALIGNS,
  TEXT_SIZES,
  TEXT_TRANSFORMS,
  TEXT_WRAPS,
  TRACKINGS,
  WEIGHTS,
  WIDTHS,
} from './tw';

import {
  fontFamilyNameSchema,
  hexColourSchema,
  resolvedMediaSchema,
  themeRoleKeySchema,
} from '../contracts';
import { upgradeMotion } from '../motion/legacy';
import { motionSpecSchema } from '../motion/schema';

/* -------------------------------------------------------------------------- */
/*                              ALIGN / JUSTIFY                               */
/* -------------------------------------------------------------------------- */

/**
 * Shared alignment vocabulary — every block that has one should use these
 * rather than its own ad hoc `z.enum(...)`, so "align right" means the same
 * thing (and has the same CSS rule) everywhere.
 */
export const alignSchema = z.enum(['start', 'center', 'end']);
export type AlignValue = z.infer<typeof alignSchema>;

export const justifySchema = z.enum(['start', 'center', 'end', 'between', 'around']);
export type JustifyValue = z.infer<typeof justifySchema>;

/* -------------------------------------------------------------------------- */
/*                                    COLOR                                   */
/* -------------------------------------------------------------------------- */

/**
 * A theme colour role (`{ role: 'accent' }`) or a literal hex that bypasses
 * the theme (`{ custom: '#112233' }`). The role is a free string, not an
 * enum: the project's theme owns the actual list of roles.
 *
 * No baked-in default: every current use is `.optional()`, and an absent
 * value means "no override" (the block keeps its own built-in colour) —
 * `zod`'s `.default()` fires even through `.optional()`, which would turn
 * every unset prop into an explicit override and defeat that distinction.
 * A block that needs a colour unconditionally sets one in its `defaults.ts`.
 */
export function colorPropSchema() {
  return z
    .union([z.object({ role: themeRoleKeySchema }), z.object({ custom: hexColourSchema })])
    .meta({ hl: 'color' });
}
export type ColorValue = { role: string } | { custom: string };

/* -------------------------------------------------------------------------- */
/*                                    FONT                                    */
/* -------------------------------------------------------------------------- */

/**
 * A theme font role (`{ role: 'heading' }`) or a literal family from the
 * Font Library (`{ family, source }`) that bypasses the theme. No baked-in
 * default, for the same reason as `colorPropSchema`.
 */
export function fontPropSchema() {
  return z
    .union([
      z.object({ role: themeRoleKeySchema }),
      z.object({
        family: fontFamilyNameSchema,
        source: z.enum(['google', 'custom']),
        assetId: z.string().optional(),
      }),
    ])
    .meta({ hl: 'font' });
}
export type FontValue =
  { role: string } | { family: string; source: 'google' | 'custom'; assetId?: string };

/* -------------------------------------------------------------------------- */
/*                           TAILWIND (RESPONSIVE)                            */
/* -------------------------------------------------------------------------- */

/**
 * One value per breakpoint (`blocks/tw.ts`): `base` always, `md` / `lg` /
 * `xl` only where the value changes. Tagged `responsive` with the control
 * that edits one breakpoint's value, so the inspector wraps that control in
 * its breakpoint switcher (the canvas viewport picks the breakpoint).
 */
export function responsiveSchema<T extends z.ZodType>(inner: T, control: ResponsiveControl) {
  return z
    .object({
      base: inner,
      md: inner.optional(),
      lg: inner.optional(),
      xl: inner.optional(),
    })
    .meta({ hl: 'responsive', control } satisfies BoundMeta);
}

export const spaceStepSchema = z.enum(SPACE_STEPS);
export const aspectRatioSchema = z.enum(ASPECT_RATIOS);

export const responsiveGapSchema = responsiveSchema(spaceStepSchema, 'gap');
export const responsiveAspectSchema = responsiveSchema(aspectRatioSchema, 'aspect');

/* -------------------------------------------------------------------------- */
/*                               STYLE (SHARED)                               */
/* -------------------------------------------------------------------------- */

const sides = <T extends z.ZodType>(step: T) =>
  z.object({ blockStart: step, blockEnd: step, inlineStart: step, inlineEnd: step }).partial();

/** One breakpoint's style (`blocks/tw.ts`'s `StyleValue`): every property optional. */
export const styleValueSchema = z
  .object({
    /**
     * The canvas handles' own values: a pixel size and a rotation, free
     * numbers rather than table steps (`blocks/tw.ts`'s `frameStyle`).
     * `0` is "as the layout has it".
     */
    frame: z
      .object({
        w: z.number().min(0).max(FRAME_SIZE_MAX),
        h: z.number().min(0).max(FRAME_SIZE_MAX),
        rotate: z.number().min(-FRAME_ROTATION_MAX).max(FRAME_ROTATION_MAX),
      })
      .partial(),
    padding: sides(spaceStepSchema),
    margin: sides(z.enum(MARGIN_STEPS)),
    radius: z.enum(RADII),
    corners: z
      .object({
        startStart: z.enum(RADII),
        startEnd: z.enum(RADII),
        endStart: z.enum(RADII),
        endEnd: z.enum(RADII),
      })
      .partial(),
    borderWidth: z.enum(BORDER_WIDTHS),
    borderStyle: z.enum(BORDER_STYLES),
    shadow: z.enum(SHADOWS),
    opacity: z.enum(OPACITIES),
    width: z.enum(WIDTHS),
    maxWidth: z.enum(MAX_WIDTHS),
    minHeight: z.enum(MIN_HEIGHTS),
    overflow: z.enum(OVERFLOWS),
    hidden: z.boolean(),
    textSize: z.enum(TEXT_SIZES),
    weight: z.enum(WEIGHTS),
    leading: z.enum(LEADINGS),
    tracking: z.enum(TRACKINGS),
    transform: z.enum(TEXT_TRANSFORMS),
    italic: z.boolean(),
    textAlign: z.enum(TEXT_ALIGNS),
    textWrap: z.enum(TEXT_WRAPS),
    decoration: z.enum(DECORATIONS),
    /** Inside a grid: how many columns / rows this block spans. */
    colSpan: z.enum(COL_SPANS),
    rowSpan: z.enum(ROW_SPANS),
  })
  .partial();

/* -------------------------------------------------------------------------- */
/*                             SURFACE AND MOTION                             */
/* -------------------------------------------------------------------------- */

/**
 * A style's surface: a background image, a gradient and/or a colour
 * overlay under the block's content — a hero over a photo, a section with a
 * wash. Layered into one `background-image` (`shared.tsx`'s `boxStyle`).
 */
export const surfaceSchema = z
  .object({
    image: resolvedMediaSchema.nullable(),
    position: z.enum(SURFACE_POSITIONS),
    fit: z.enum(SURFACE_FITS),
    repeat: z.boolean(),
    /** `background-attachment: fixed` — a parallax-like scroll. */
    fixed: z.boolean(),
    /** A colour wash over the image, 0–100 % opaque. */
    overlay: z
      .object({ color: colorPropSchema(), opacity: z.number().int().min(0).max(100) })
      .partial(),
    /** A linear gradient, under the overlay and over the image. */
    gradient: z
      .object({
        from: colorPropSchema(),
        to: colorPropSchema(),
        via: colorPropSchema(),
        angle: z.number().int().min(0).max(360),
      })
      .partial(),
  })
  .partial();
export type SurfaceValue = z.infer<typeof surfaceSchema>;

/**
 * A style's motion (M47, decision 320): the spec of `motion/schema.ts` —
 * enter, hover, press, loop, scroll, text, stagger. The pre-M47
 * `{ reveal, delay, hover }` upgrades on read (`motion/legacy.ts`).
 */
export const motionSchema = z.preprocess(upgradeMotion, motionSpecSchema);
export type MotionValue = MotionSpec;

/* -------------------------------------------------------------------------- */
/*                                    ICON                                    */
/* -------------------------------------------------------------------------- */

/**
 * An icon as a block draws it: a name from the renderer's own set
 * (`icon-paths.ts`: `globe`, `credit-card`…), a media asset (an SVG exported
 * from Figma), or a glyph (an emoji, a character). The first one set wins in
 * that order. Never a bare word drawn as text — imported cards once showed
 * "globe" and "credit-card" as words for want of this.
 */
export const iconSchema = z
  .object({
    name: z.string().max(40),
    media: resolvedMediaSchema.nullable(),
    glyph: z.string().max(8),
  })
  .partial()
  .describe(
    'An icon: { "name": "<icon name from get_style_schema>" }, or { "media": <imported SVG/PNG> }, or { "glyph": "✓" }.'
  );
export type IconValue = z.infer<typeof iconSchema>;

/**
 * The style every block carries, and every styleable element inside one:
 * Tailwind utilities per breakpoint (`base` / `md` / `lg` / `xl`), plus the
 * values Tailwind cannot know ahead — colours and the font, resolved against
 * the theme into variables (`shared.tsx`'s `boxStyle`). Not responsive: a
 * theme role already adapts, to the colour scheme included.
 */
/**
 * Free Tailwind utilities on a style (rung 2½): exact values the tables
 * have no step for (`pt-[72px]`, `lg:grid-cols-[2fr_1fr]`, `tracking-[-0.02em]`,
 * `bg-[radial-gradient(…)]`), breakpoint prefixes typed by hand. Validated
 * token by token (`classIssues`): a refused token names itself in the error.
 */
export const utilityClassesSchema = z
  .string()
  .max(CLASS_TOKEN_MAX * CLASS_TOKENS_MAX + CLASS_TOKENS_MAX)
  .superRefine((value, ctx) => {
    const { rejected } = classIssues(value);
    if (rejected.length === 0) return;
    ctx.addIssue({
      code: 'custom',
      message: `Refused utilities: ${rejected.join(' ')} — no url(), no quotes, no < > { } ; @, balanced brackets, at most ${CLASS_TOKENS_MAX} of ${CLASS_TOKEN_MAX} characters.`,
    });
  })
  .describe(
    'Space-separated Tailwind v4 utilities, arbitrary values and md:/lg:/xl: prefixes included (pt-[72px] lg:grid-cols-[2fr_1fr] tracking-[-0.02em]). Applied after the tokens.'
  );

export const boxStyleObjectSchema = z
  .object({
    base: styleValueSchema,
    md: styleValueSchema,
    lg: styleValueSchema,
    xl: styleValueSchema,
    background: colorPropSchema(),
    borderColor: colorPropSchema(),
    color: colorPropSchema(),
    font: fontPropSchema(),
    surface: surfaceSchema,
    motion: motionSchema,
    classes: utilityClassesSchema,
  })
  .partial();
export type BoxStyle = z.infer<typeof boxStyleObjectSchema>;

export const styleSchema = boxStyleObjectSchema.meta({ hl: 'style' } satisfies BoundMeta);

/**
 * One item of a repeated prop's own style (`buttons[1].style`) — on the item,
 * so it moves, duplicates and deletes with it. Unset renders as before.
 */
export const itemStyleSchema = styleSchema.optional();

/**
 * The styles of a block's named elements (`title`, `description`…), keyed by
 * the element's `data-hl-field` name — the one a click on the canvas focuses.
 * Which names a block offers is its definition's `elements` list.
 */
export function elementsSchema<const K extends string>(names: readonly K[]) {
  const shape = Object.fromEntries(names.map((name) => [name, boxStyleObjectSchema])) as Record<
    K,
    typeof boxStyleObjectSchema
  >;
  return z
    .object(shape)
    .partial()
    .meta({ hl: 'elements', elements: [...names] } satisfies BoundMeta);
}

/**
 * The two style props every block carries: `style` for its own box,
 * `elements` for the elements it names (their `data-hl-field`). Spread into a
 * block schema: `...styleProps(['title', 'description'])`.
 */
/**
 * Which hand-coded variant of the block this instance draws.
 *
 * Hlou's own components ignore it. An edited `renderer/blocks/<key>/Component.tsx`
 * (Design › Code) branches on it — `custom:<name>` — so one
 * instance can look like a design no token expresses while every other
 * instance of the type renders as before. Not a custom block: a block of a
 * shape no built-in block has is its own type, created by a person.
 */
export const CODE_VARIANT_PATTERN = /^custom:[a-z0-9-]{1,40}$/;
export const codeVariantSchema = z
  .string()
  .regex(CODE_VARIANT_PATTERN)
  .meta({ hl: 'codeVariant' })
  .describe(
    'Hand-coded variant this instance draws ("custom:<name>"); only an edited Component.tsx reads it.'
  );

export function styleProps<const K extends string>(elements: readonly K[]) {
  return {
    style: styleSchema,
    elements: elementsSchema(elements),
    /* Nullable too: a model writing "no variant" sends null, not nothing. */
    codeVariant: codeVariantSchema.nullable().optional(),
  };
}

/* -------------------------------------------------------------------------- */
/*                              FREE POSITION                                 */
/* -------------------------------------------------------------------------- */

/** Nine anchors: the corner / edge / centre an element's offset counts from. */
export const POSITION_ANCHORS = [
  'top-start',
  'top-center',
  'top-end',
  'middle-start',
  'middle-center',
  'middle-end',
  'bottom-start',
  'bottom-center',
  'bottom-end',
] as const;
export type PositionAnchor = (typeof POSITION_ANCHORS)[number];

export const POSITION_OFFSET_MAX = 2000;
export const POSITION_WIDTH_MAX = 2000;
export const POSITION_Z_MAX = 50;

/**
 * Where a free element sits inside its host block, at one breakpoint. `x`
 * runs from the anchor's inline side (so it mirrors under RTL) toward the
 * inside of the block; `y` from its block side, downward for `top` and
 * `middle`, upward for `bottom`. `width: 0` means "as wide as its content".
 */
export const positionValueSchema = z.object({
  anchor: z.enum(POSITION_ANCHORS),
  x: z.number().int().min(-POSITION_OFFSET_MAX).max(POSITION_OFFSET_MAX),
  y: z.number().int().min(-POSITION_OFFSET_MAX).max(POSITION_OFFSET_MAX),
  width: z.number().int().min(0).max(POSITION_WIDTH_MAX),
  z: z.number().int().min(0).max(POSITION_Z_MAX),
});
export type PositionValue = z.infer<typeof positionValueSchema>;

export const positionSchema = z
  .object({
    base: positionValueSchema,
    md: positionValueSchema.optional(),
    lg: positionValueSchema.optional(),
    xl: positionValueSchema.optional(),
  })
  .meta({ hl: 'position' } satisfies BoundMeta);
export type ResponsivePosition = Responsive<PositionValue>;
