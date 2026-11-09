/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import {
  APPEAR_PRESET_IDS,
  HOVER_PRESET_IDS,
  LOOP_PRESET_IDS,
  PRESS_PRESET_IDS,
  SCROLL_PRESET_IDS,
  TEXT_PRESET_IDS,
} from './presets';

/*
 * THE MOTION SPEC (M47, decision 320): what `style.motion` holds on a block's
 * `style`, on every `elements.<name>` and on an item's `style`. Every part is
 * optional and pure data — the vocabulary of Motion (motion.dev, the `motion`
 * package's vanilla API: `animate`, `inView`, `scroll`, `hover`, `press`,
 * `stagger`, springs), so a part resolves (`personality.ts`) straight into
 * the options Motion takes. Presets come first; keyframes when no preset fits.
 *
 * Units: seconds for every time, pixels or `"<n>%"` for x / y, pixels for
 * blur, degrees for rotations, percent for a clip. `x` is LOGICAL — positive
 * moves toward the inline end — so a slide flips in RTL by itself.
 */

/* -------------------------------------------------------------------------- */
/*                                 CONSTANTS                                  */
/* -------------------------------------------------------------------------- */

/** Motion's named easings, as its `ease` option spells them. */
export const MOTION_EASES = [
  'linear',
  'easeIn',
  'easeOut',
  'easeInOut',
  'circIn',
  'circOut',
  'circInOut',
  'backIn',
  'backOut',
  'backInOut',
  'anticipate',
] as const;
export type MotionEaseName = (typeof MOTION_EASES)[number];

export const MOTION_TRIGGERS = ['load', 'inView'] as const;
export const MOTION_MEDIA = ['all', 'no-mobile', 'desktop'] as const;
export const MOTION_SPLITS = ['words', 'chars', 'lines'] as const;
export const MOTION_STAGGER_FROM = ['first', 'last', 'center'] as const;
/** The side a clip hides the element from. `start` / `end` are logical. */
export const MOTION_CLIP_SIDES = ['top', 'bottom', 'start', 'end'] as const;
/** What a scroll range animates. */
export const MOTION_SCROLL_PROPERTIES = ['opacity', 'x', 'y', 'scale', 'rotate', 'blur'] as const;
/**
 * Where a scroll-linked animation starts and ends: « <element edge> <viewport
 * edge> », Motion's `scroll({ offset })` pairs. `start end` = the element's
 * top meets the viewport's bottom (it starts entering).
 */
export const MOTION_SCROLL_OFFSETS = [
  'start end',
  'start center',
  'start start',
  'center end',
  'center center',
  'center start',
  'end end',
  'end center',
  'end start',
] as const;

/** Bounds every number in the spec is held to. */
export const MOTION_LIMITS = {
  /** Seconds. */
  duration: { min: 0, max: 10 },
  delay: { min: 0, max: 10 },
  loopDuration: { min: 0.1, max: 60 },
  repeatDelay: { min: 0, max: 30 },
  stagger: { min: 0, max: 2 },
  textStagger: { min: 0, max: 1 },
  /** Pixels, both signs. */
  offsetPx: { min: -2000, max: 2000 },
  /** Percent of the element's own size, both signs. */
  offsetPercent: { min: -200, max: 200 },
  opacity: { min: 0, max: 1 },
  scale: { min: 0, max: 4 },
  /** Degrees. */
  rotate: { min: -360, max: 360 },
  rotate3d: { min: -180, max: 180 },
  /** Pixels. */
  blur: { min: 0, max: 40 },
  clip: { min: 0, max: 100 },
  bounce: { min: 0, max: 1 },
  stiffness: { min: 1, max: 1000 },
  damping: { min: 0, max: 100 },
  mass: { min: 0.1, max: 10 },
  amount: { min: 0, max: 1 },
  loopKeyframes: 8,
  scrollRanges: 6,
} as const;

const bounded = (key: keyof typeof MOTION_LIMITS, description: string) => {
  const limit = MOTION_LIMITS[key] as { min: number; max: number };
  return z.number().min(limit.min).max(limit.max).describe(description);
};

/* -------------------------------------------------------------------------- */
/*                                  KEYFRAME                                  */
/* -------------------------------------------------------------------------- */

const PERCENT = /^-?\d{1,3}(\.\d{1,2})?%$/;

/** A translation: pixels, or `"<n>%"` of the element's own size. */
const offsetSchema = (description: string) =>
  z
    .union([
      z.number().min(MOTION_LIMITS.offsetPx.min).max(MOTION_LIMITS.offsetPx.max),
      z
        .string()
        .regex(PERCENT)
        .refine(
          (value) => {
            const n = Number.parseFloat(value);
            return n >= MOTION_LIMITS.offsetPercent.min && n <= MOTION_LIMITS.offsetPercent.max;
          },
          { message: 'A percentage between -200% and 200%.' }
        ),
    ])
    .describe(description);

export const motionClipSchema = z
  .object({
    side: z
      .enum(MOTION_CLIP_SIDES)
      .describe('The side the element is hidden from (start / end follow the reading direction).'),
    amount: bounded('clip', 'How much is hidden, 0–100 %: 100 hides it all.'),
  })
  .describe('A clip: the element hidden from one side, revealed as the clip opens.');
export type MotionClip = z.infer<typeof motionClipSchema>;

/**
 * One visual state. In `enter.from` the state the element starts from (it
 * animates to its natural look); in `hover.to` / `press.to` the state it goes
 * to; in `loop.keyframes` one step of the loop.
 */
export const motionKeyframeSchema = z
  .object({
    opacity: bounded('opacity', 'Opacity, 0–1.'),
    x: offsetSchema(
      'Inline shift: pixels or "<n>%". Positive moves toward the end of the line (right in LTR, left in RTL).'
    ),
    y: offsetSchema('Vertical shift: pixels or "<n>%". Positive moves down.'),
    scale: bounded('scale', 'Scale, 1 = natural size.'),
    rotate: bounded('rotate', 'Rotation in degrees.'),
    rotateX: bounded('rotate3d', '3D rotation around the horizontal axis, degrees (a flip).'),
    rotateY: bounded('rotate3d', '3D rotation around the vertical axis, degrees (a tilt).'),
    blur: bounded('blur', 'Blur in pixels, 0–40.'),
    clip: motionClipSchema,
  })
  .partial()
  .describe('A visual state: opacity, x, y, scale, rotate, rotateX, rotateY, blur, clip.');
export type MotionKeyframe = z.infer<typeof motionKeyframeSchema>;
export type MotionKeyframeKey = keyof MotionKeyframe;

/* -------------------------------------------------------------------------- */
/*                                 TRANSITION                                 */
/* -------------------------------------------------------------------------- */

/** A cubic-bezier `[x1, y1, x2, y2]`: x within 0–1, y may overshoot. */
export const motionCubicBezierSchema = z
  .tuple([
    z.number().min(0).max(1).describe('x1, 0–1.'),
    z.number().min(-2).max(3).describe('y1.'),
    z.number().min(0).max(1).describe('x2, 0–1.'),
    z.number().min(-2).max(3).describe('y2.'),
  ])
  .describe('A cubic-bezier curve [x1, y1, x2, y2].');

export const motionEaseSchema = z
  .union([z.enum(MOTION_EASES), motionCubicBezierSchema])
  .describe(`An easing: ${MOTION_EASES.join(', ')}, or a cubic-bezier [x1, y1, x2, y2].`);
export type MotionEase = z.infer<typeof motionEaseSchema>;

const delayField = () => bounded('delay', 'Seconds before it starts.');

/** A spring set by its physics. Listed first: `stiffness` is what tells it apart. */
const springPhysicsSchema = z
  .strictObject({
    type: z.literal('spring').describe('A spring.'),
    stiffness: bounded('stiffness', 'Spring stiffness: higher is snappier.'),
    damping: bounded('damping', 'Spring damping: lower oscillates more.').optional(),
    mass: bounded('mass', 'Spring mass: higher is heavier and slower.').optional(),
    delay: delayField().optional(),
  })
  .describe('A spring by its physics: stiffness, damping, mass.');

/** A spring set by how long it takes and how much it bounces. */
const springDurationSchema = z
  .strictObject({
    type: z.literal('spring').describe('A spring.'),
    duration: bounded(
      'duration',
      'Seconds the spring takes to visually reach its target.'
    ).optional(),
    bounce: bounded('bounce', 'Bounciness, 0 (none) – 1 (very bouncy).').optional(),
    delay: delayField().optional(),
  })
  .describe('A spring by its duration and bounce.');

/** A tween: a duration and an easing. `type` may be left out. */
const tweenSchema = z
  .strictObject({
    type: z.literal('tween').describe('A tween (the default).').optional(),
    duration: bounded('duration', 'Seconds.').optional(),
    delay: delayField().optional(),
    ease: motionEaseSchema.optional(),
  })
  .describe('A tween: duration, delay, ease.');

/**
 * How a part moves — the three shapes are strict, so a spring's physics out of
 * bounds is refused rather than read as a duration spring. Absent = the preset's own feel, else the site's motion
 * personality. A field left out inherits the same way, so `{ "delay": 0.2 }`
 * delays a preset without changing its feel.
 */
export const motionTransitionSchema = z
  .union([springPhysicsSchema, springDurationSchema, tweenSchema])
  .describe(
    'How it moves: { duration, delay, ease } (a tween), { type: "spring", duration, bounce }, or { type: "spring", stiffness, damping, mass }. Left out = the site’s motion personality.'
  );
export type MotionTransition = z.infer<typeof motionTransitionSchema>;

/* -------------------------------------------------------------------------- */
/*                                   PARTS                                    */
/* -------------------------------------------------------------------------- */

export const motionEnterSchema = z
  .object({
    preset: z
      .enum(APPEAR_PRESET_IDS)
      .describe(`An appear preset: ${APPEAR_PRESET_IDS.join(', ')}.`),
    from: motionKeyframeSchema.describe(
      'The state it appears from, over the preset’s (or instead of one).'
    ),
    trigger: z
      .enum(MOTION_TRIGGERS)
      .describe('When it plays: inView (scrolled into view, the default) or load.'),
    once: z.boolean().describe('Play only the first time it comes into view (default true).'),
    amount: bounded('amount', 'How much of it must be visible to start, 0–1 (default 0.2).'),
    margin: z
      .string()
      .regex(/^(-?\d{1,4}(px|%))( -?\d{1,4}(px|%)){0,3}$/)
      .describe('The viewport margin, as CSS: "0px 0px -10% 0px" starts it a little later.'),
    transition: motionTransitionSchema,
  })
  .partial()
  .describe('How it appears: a preset or a from-state, when, and how it moves.');
export type MotionEnter = z.infer<typeof motionEnterSchema>;

const gestureSchema = <const T extends readonly [string, ...string[]]>(presets: T, what: string) =>
  z
    .object({
      preset: z.enum(presets).describe(`A ${what} preset: ${presets.join(', ')}.`),
      to: motionKeyframeSchema.describe(`The state it goes to on ${what}, over the preset’s.`),
      transition: motionTransitionSchema,
    })
    .partial()
    .describe(`Its response to ${what}: a preset or a to-state.`);

export const motionHoverSchema = gestureSchema(HOVER_PRESET_IDS, 'hover');
export type MotionHover = z.infer<typeof motionHoverSchema>;

export const motionPressSchema = gestureSchema(
  [...PRESS_PRESET_IDS, ...HOVER_PRESET_IDS] as const,
  'press'
);
export type MotionPress = z.infer<typeof motionPressSchema>;

export const motionLoopSchema = z
  .object({
    preset: z.enum(LOOP_PRESET_IDS).describe(`A loop preset: ${LOOP_PRESET_IDS.join(', ')}.`),
    keyframes: z
      .array(motionKeyframeSchema)
      .min(2)
      .max(MOTION_LIMITS.loopKeyframes)
      .describe('The states it cycles through, 2–8, instead of a preset.'),
    duration: bounded('loopDuration', 'Seconds for one cycle.'),
    repeatDelay: bounded('repeatDelay', 'Seconds of rest between cycles.'),
    mirror: z.boolean().describe('Play back and forth instead of restarting.'),
  })
  .partial()
  .describe('A loop that runs while it is on screen: a preset or keyframes.');
export type MotionLoop = z.infer<typeof motionLoopSchema>;

export const motionScrollRangeSchema = z
  .object({
    property: z
      .enum(MOTION_SCROLL_PROPERTIES)
      .describe(`What the scroll drives: ${MOTION_SCROLL_PROPERTIES.join(', ')}.`),
    from: z
      .number()
      .min(MOTION_LIMITS.offsetPx.min)
      .max(MOTION_LIMITS.offsetPx.max)
      .describe('Its value at the start offset (x / y and blur in px, rotate in degrees).'),
    to: z
      .number()
      .min(MOTION_LIMITS.offsetPx.min)
      .max(MOTION_LIMITS.offsetPx.max)
      .describe('Its value at the end offset.'),
  })
  .superRefine((range, ctx) => {
    const limit =
      range.property === 'opacity'
        ? MOTION_LIMITS.opacity
        : range.property === 'scale'
          ? MOTION_LIMITS.scale
          : range.property === 'rotate'
            ? MOTION_LIMITS.rotate
            : range.property === 'blur'
              ? MOTION_LIMITS.blur
              : MOTION_LIMITS.offsetPx;
    for (const key of ['from', 'to'] as const) {
      if (range[key] < limit.min || range[key] > limit.max) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${range.property} goes from ${limit.min} to ${limit.max}.`,
        });
      }
    }
  })
  .describe('One property driven by the scroll, from one value to another.');
export type MotionScrollRange = z.infer<typeof motionScrollRangeSchema>;

export const motionScrollOffsetSchema = z
  .enum(MOTION_SCROLL_OFFSETS)
  .describe('« <element edge> <viewport edge> »: "start end" = its top meets the screen’s bottom.');
export type MotionScrollOffset = z.infer<typeof motionScrollOffsetSchema>;

export const motionScrollSchema = z
  .object({
    preset: z.enum(SCROLL_PRESET_IDS).describe(`A scroll preset: ${SCROLL_PRESET_IDS.join(', ')}.`),
    ranges: z
      .array(motionScrollRangeSchema)
      .min(1)
      .max(MOTION_LIMITS.scrollRanges)
      .describe('The properties the scroll drives, instead of a preset.'),
    offset: z
      .tuple([motionScrollOffsetSchema, motionScrollOffsetSchema])
      .describe('Where it starts and ends: ["start end", "end start"] spans its whole passage.'),
  })
  .partial()
  .describe('Linked to the scroll: parallax, a fade or a scale as it passes.');
export type MotionScroll = z.infer<typeof motionScrollSchema>;

export const motionTextSchema = z
  .object({
    split: z.enum(MOTION_SPLITS).describe('Animate it by words, chars or lines.'),
    stagger: bounded('textStagger', 'Seconds between one piece and the next.'),
    preset: z.enum(TEXT_PRESET_IDS).describe(`A text preset: ${TEXT_PRESET_IDS.join(', ')}.`),
  })
  .partial()
  .describe('A text that appears piece by piece (only on an element holding text).');
export type MotionText = z.infer<typeof motionTextSchema>;

export const motionStaggerSchema = z
  .object({
    each: bounded('stagger', 'Seconds between one child and the next.'),
    from: z.enum(MOTION_STAGGER_FROM).describe('Which child goes first: first, last or center.'),
  })
  .partial()
  .describe('Play `enter` on its direct children one after another instead of on itself.');
export type MotionStagger = z.infer<typeof motionStaggerSchema>;

/* -------------------------------------------------------------------------- */
/*                                    SPEC                                    */
/* -------------------------------------------------------------------------- */

/** The whole motion of one element. Every part optional. */
export const motionSpecSchema = z
  .object({
    enter: motionEnterSchema,
    hover: motionHoverSchema,
    press: motionPressSchema,
    loop: motionLoopSchema,
    scroll: motionScrollSchema,
    text: motionTextSchema,
    stagger: motionStaggerSchema,
    transition: motionTransitionSchema.describe(
      'The default transition of every part that sets none of its own.'
    ),
    media: z
      .enum(MOTION_MEDIA)
      .describe('Where it plays: all (default), no-mobile, or desktop only.'),
  })
  .partial()
  .describe(
    'Motion: enter (appear), hover, press, loop, scroll, text, stagger. Presets by name first; keyframes only when no preset fits. Visitors who ask for reduced motion get a short fade.'
  );
export type MotionSpec = z.infer<typeof motionSpecSchema>;
export type MotionPart = Exclude<keyof MotionSpec, 'transition' | 'media'>;
export const MOTION_PARTS = [
  'enter',
  'hover',
  'press',
  'loop',
  'scroll',
  'text',
  'stagger',
] as const satisfies readonly MotionPart[];
