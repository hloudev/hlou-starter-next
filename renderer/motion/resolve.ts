/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { MotionPersonality } from './personality';
import type { MotionPresetTransition } from './presets';
import type {
  MotionEase,
  MotionEaseName,
  MotionKeyframe,
  MotionScrollOffset,
  MotionSpec,
  MotionTransition,
} from './schema';
import {
  APPEAR_PRESETS,
  GESTURE_PRESETS,
  LOOP_PRESETS,
  SCROLL_PRESETS,
  TEXT_PRESETS,
} from './presets';

/*
 * THE ONE PURE FUNCTION that turns a spec into what Motion takes
 * (`resolveMotion`), against a site's motion personality (its
 * schema is `personality.ts`'s). A feel (calm, snappy, playful, luxe) sets
 * the base duration, easing and spring; `durationScale` stretches every
 * inherited duration; `ease` / `spring` override the feel's. A value the
 * spec states itself is never scaled — only what it inherits.
 *
 * Reduced motion, when the visitor asks for it:
 * - policy `reduce` (the default): enter and text become a short opacity
 *   fade, scroll and loop are off, hover and press keep only opacity;
 * - policy `off`: no motion at all.
 *
 * ZOD-FREE, like `compile.ts` and `presets.ts`: the page runtime
 * (`runtime.ts`) ships it in the browser's `motion` island (MO2). Only
 * types come from the zod modules.
 */

/* -------------------------------------------------------------------------- */
/*                                 PERSONALITY                                */
/* -------------------------------------------------------------------------- */

export const MOTION_FEELS = ['calm', 'snappy', 'playful', 'luxe'] as const;
export type MotionFeel = (typeof MOTION_FEELS)[number];
export const MOTION_REDUCED_POLICIES = ['reduce', 'off'] as const;

/** What each feel means: a base duration (s), an easing and a spring. */
export const MOTION_FEEL_DEFAULTS: Record<
  MotionFeel,
  { duration: number; ease: MotionEase; spring: { duration: number; bounce: number } }
> = {
  calm: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1], spring: { duration: 0.7, bounce: 0.1 } },
  snappy: { duration: 0.35, ease: [0.2, 0, 0, 1], spring: { duration: 0.35, bounce: 0.15 } },
  playful: { duration: 0.55, ease: 'backOut', spring: { duration: 0.5, bounce: 0.4 } },
  luxe: { duration: 1.1, ease: [0.16, 1, 0.3, 1], spring: { duration: 1, bounce: 0 } },
};

/**
 * The personality of a theme that sets none: calm, unscaled, `reduce`.
 * Spelt out rather than parsed, to stay zod-free; `motionPersonalitySchema
 * .parse({})` gives the same (`personality.test.ts`).
 */
export const DEFAULT_MOTION_PERSONALITY: MotionPersonality = {
  feel: 'calm',
  durationScale: 1,
  reducedMotion: 'reduce',
};

/* -------------------------------------------------------------------------- */
/*                               RESOLVED TYPES                               */
/* -------------------------------------------------------------------------- */

/** Motion's `animate()` options, as far as a spec reaches. */
export type MotionOptions = {
  duration?: number;
  delay?: number;
  ease?: MotionEaseName | readonly [number, number, number, number];
  type?: 'spring';
  /** A spring's perceived duration: Motion's `visualDuration`. */
  visualDuration?: number;
  bounce?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
  repeat?: number;
  repeatType?: 'loop' | 'mirror';
  repeatDelay?: number;
};

export type MotionCssProperty =
  'opacity' | 'x' | 'y' | 'scale' | 'rotate' | 'rotateX' | 'rotateY' | 'filter' | 'clipPath';
type MotionCssValue = number | string;
/** A target (`hover.to`) or a single state. */
export type MotionTarget = Partial<Record<MotionCssProperty, MotionCssValue>>;
/** Keyframes as Motion takes them: one array per property. */
export type MotionKeyframes = Partial<Record<MotionCssProperty, MotionCssValue[]>>;

/** Values to set on the element before it animates (`transformPerspective` for a 3D turn). */
export type MotionSet = { transformPerspective?: number };

export type ResolvedEnter = {
  keyframes: MotionKeyframes;
  options: MotionOptions;
  trigger: 'load' | 'inView';
  once: boolean;
  /** Motion's `inView` `amount`. */
  amount: number;
  /** Motion's `inView` `margin`. */
  margin?: string;
  set?: MotionSet;
};
export type ResolvedGesture = {
  /** Where it goes while hovered / pressed. */
  to: MotionTarget;
  /** Where it returns: the natural state of the same properties. */
  rest: MotionTarget;
  options: MotionOptions;
  set?: MotionSet;
};
export type ResolvedLoop = { keyframes: MotionKeyframes; options: MotionOptions; set?: MotionSet };
export type ResolvedScroll = {
  /** `[from, to]` per property: animate them linearly, driven by `scroll()`. */
  keyframes: MotionKeyframes;
  offset: [MotionScrollOffset, MotionScrollOffset];
};
export type ResolvedText = {
  split: 'words' | 'chars' | 'lines';
  /** Per piece. */
  keyframes: MotionKeyframes;
  options: MotionOptions;
  /** Seconds between pieces: Motion's `stagger(n)` as the delay. */
  stagger: number;
};
export type ResolvedStagger = { each: number; from: 'first' | 'last' | 'center' };

/** What the runtime plays, every part ready for Motion. */
export type ResolvedMotion = {
  enter?: ResolvedEnter;
  hover?: ResolvedGesture;
  press?: ResolvedGesture;
  loop?: ResolvedLoop;
  scroll?: ResolvedScroll;
  text?: ResolvedText;
  stagger?: ResolvedStagger;
  media: 'all' | 'no-mobile' | 'desktop';
};

export type MotionEnvironment = {
  /** The visitor prefers reduced motion (or the preview simulates it). */
  reducedMotion: boolean;
  dir: 'ltr' | 'rtl';
};

/* -------------------------------------------------------------------------- */
/*                                 KEYFRAMES                                  */
/* -------------------------------------------------------------------------- */

/** Every property at rest: what an element looks like with no motion on it. */
const NATURAL: Required<MotionTarget> = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  filter: 'blur(0px)',
  clipPath: 'inset(0% 0% 0% 0%)',
};

const PERSPECTIVE = 800;

function flipX(value: number | string, dir: 'ltr' | 'rtl'): number | string {
  if (dir === 'ltr') return value;
  if (typeof value === 'number') return value === 0 ? 0 : -value;
  return value.startsWith('-') ? value.slice(1) : `-${value}`;
}

function clipPath(clip: NonNullable<MotionKeyframe['clip']>, dir: 'ltr' | 'rtl'): string {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const physical =
    clip.side === 'start'
      ? dir === 'rtl'
        ? 'right'
        : 'left'
      : clip.side === 'end'
        ? dir === 'rtl'
          ? 'left'
          : 'right'
        : clip.side;
  inset[physical] = clip.amount;
  return `inset(${inset.top}% ${inset.right}% ${inset.bottom}% ${inset.left}%)`;
}

/** One spec state → Motion's values: blur as a filter, a clip as a `clipPath`, x flipped in RTL. */
export function keyframeTarget(keyframe: MotionKeyframe, dir: 'ltr' | 'rtl'): MotionTarget {
  const out: MotionTarget = {};
  if (keyframe.opacity !== undefined) out.opacity = keyframe.opacity;
  if (keyframe.x !== undefined) out.x = flipX(keyframe.x, dir);
  if (keyframe.y !== undefined) out.y = keyframe.y;
  if (keyframe.scale !== undefined) out.scale = keyframe.scale;
  if (keyframe.rotate !== undefined) out.rotate = keyframe.rotate;
  if (keyframe.rotateX !== undefined) out.rotateX = keyframe.rotateX;
  if (keyframe.rotateY !== undefined) out.rotateY = keyframe.rotateY;
  if (keyframe.blur !== undefined) out.filter = `blur(${keyframe.blur}px)`;
  if (keyframe.clip !== undefined) out.clipPath = clipPath(keyframe.clip, dir);
  return out;
}

const propertiesOf = (target: MotionTarget) => Object.keys(target) as MotionCssProperty[];

/** The natural values of the properties a target sets. */
function restOf(target: MotionTarget): MotionTarget {
  return Object.fromEntries(propertiesOf(target).map((key) => [key, NATURAL[key]]));
}

/** States → one array per property; a state that leaves a property out holds it natural. */
function sequence(states: MotionTarget[]): MotionKeyframes {
  const keys = [...new Set(states.flatMap(propertiesOf))];
  return Object.fromEntries(
    keys.map((key) => [key, states.map((state) => state[key] ?? NATURAL[key])])
  );
}

function needsPerspective(keyframes: MotionKeyframes | MotionTarget): MotionSet | undefined {
  return 'rotateX' in keyframes || 'rotateY' in keyframes
    ? { transformPerspective: PERSPECTIVE }
    : undefined;
}

const withSet = <T extends object>(value: T, set: MotionSet | undefined): T =>
  set ? { ...value, set } : value;

/* -------------------------------------------------------------------------- */
/*                                TRANSITIONS                                 */
/* -------------------------------------------------------------------------- */

type FieldBag = Partial<
  Record<
    'type' | 'duration' | 'delay' | 'ease' | 'bounce' | 'stiffness' | 'damping' | 'mass',
    unknown
  >
>;

const num = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

function easeOption(ease: MotionEase): MotionOptions['ease'] {
  return typeof ease === 'string' ? ease : ([...ease] as [number, number, number, number]);
}

/**
 * The options one part moves with. Each field comes from the first that has
 * it: the part's own transition, the element's, the preset's hint, the
 * personality. Inherited durations are scaled by `durationScale`; a duration
 * the spec states is not.
 */
export function resolveTransition(
  own: MotionTransition | undefined,
  element: MotionTransition | undefined,
  hint: MotionPresetTransition | undefined,
  personality: MotionPersonality
): MotionOptions {
  const feel = MOTION_FEEL_DEFAULTS[personality.feel];
  const scale = personality.durationScale;
  const layers = [own, element].filter(Boolean) as FieldBag[];
  const pick = (key: keyof FieldBag): unknown =>
    layers.find((layer) => layer[key] !== undefined)?.[key];
  const delay = num(pick('delay'));
  const delayed = (options: MotionOptions): MotionOptions =>
    delay !== undefined && delay > 0 ? { ...options, delay } : options;

  const type = (pick('type') as 'tween' | 'spring' | undefined) ?? hint?.type ?? 'tween';
  const factor = hint?.durationFactor ?? 1;

  if (type === 'spring') {
    const stiffness = num(pick('stiffness'));
    if (stiffness !== undefined) {
      const damping = num(pick('damping'));
      const mass = num(pick('mass'));
      return delayed({
        type: 'spring',
        stiffness,
        ...(damping !== undefined ? { damping } : {}),
        ...(mass !== undefined ? { mass } : {}),
      });
    }
    const springDuration = personality.spring?.duration ?? feel.spring.duration;
    return delayed({
      type: 'spring',
      visualDuration: round(num(pick('duration')) ?? springDuration * factor * scale),
      bounce:
        num(pick('bounce')) ?? hint?.bounce ?? personality.spring?.bounce ?? feel.spring.bounce,
    });
  }
  const ease =
    (pick('ease') as MotionEase | undefined) ?? hint?.ease ?? personality.ease ?? feel.ease;
  return delayed({
    duration: round(num(pick('duration')) ?? feel.duration * factor * scale),
    ease: easeOption(ease),
  });
}

const round = (value: number): number => Math.round(value * 1000) / 1000;

/** A short opacity fade: what enter and text become under reduced motion. */
const REDUCED_FADE: MotionOptions = { duration: 0.2, ease: 'easeOut' };

/* -------------------------------------------------------------------------- */
/*                                   RESOLVE                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_AMOUNT = 0.2;
const DEFAULT_OFFSET: [MotionScrollOffset, MotionScrollOffset] = ['start end', 'end start'];

/**
 * A spec, the site's personality and the visitor's environment → concrete
 * keyframes and Motion options for every part it sets. Pure, server-safe:
 * the runtime (MO2), the canvas (MO5) and the editor's code peek read it.
 */
export function resolveMotion(
  spec: MotionSpec | null | undefined,
  personality: MotionPersonality = DEFAULT_MOTION_PERSONALITY,
  env: MotionEnvironment
): ResolvedMotion {
  const media = spec?.media ?? 'all';
  if (!spec) return { media };
  if (env.reducedMotion && personality.reducedMotion === 'off') return { media };
  const reduced = env.reducedMotion;
  const { dir } = env;
  const out: ResolvedMotion = { media };

  /* Enter. */
  const enterSpec = spec.enter;
  if (enterSpec) {
    const preset = enterSpec.preset
      ? APPEAR_PRESETS[enterSpec.preset]
      : enterSpec.from
        ? undefined
        : APPEAR_PRESETS.fade;
    const from = keyframeTarget({ ...preset?.from, ...enterSpec.from }, dir);
    const base = {
      trigger: enterSpec.trigger ?? 'inView',
      once: enterSpec.once ?? true,
      amount: enterSpec.amount ?? DEFAULT_AMOUNT,
      ...(enterSpec.margin ? { margin: enterSpec.margin } : {}),
    };
    if (reduced) {
      out.enter = {
        ...base,
        keyframes: { opacity: [from.opacity ?? 0, 1] },
        options: REDUCED_FADE,
      };
    } else {
      const keyframes = sequence([from, restOf(from)]);
      out.enter = withSet(
        {
          ...base,
          keyframes,
          options: resolveTransition(
            enterSpec.transition,
            spec.transition,
            preset?.transition,
            personality
          ),
        },
        needsPerspective(keyframes)
      );
    }
  }

  /* Hover and press. */
  for (const part of ['hover', 'press'] as const) {
    const gesture = spec[part];
    if (!gesture) continue;
    const preset = gesture.preset ? GESTURE_PRESETS[gesture.preset] : undefined;
    const merged: MotionKeyframe = { ...preset?.to, ...gesture.to };
    if (Object.keys(merged).length === 0) continue;
    const target = keyframeTarget(reduced ? pickOpacity(merged) : merged, dir);
    if (Object.keys(target).length === 0) continue;
    out[part] = withSet(
      {
        to: target,
        rest: restOf(target),
        options: reduced
          ? REDUCED_FADE
          : resolveTransition(gesture.transition, spec.transition, preset?.transition, personality),
      },
      needsPerspective(target)
    );
  }

  /* Loop and scroll: off under reduced motion. */
  const loopSpec = spec.loop;
  if (loopSpec && !reduced) {
    const preset = loopSpec.preset ? LOOP_PRESETS[loopSpec.preset] : undefined;
    const states = loopSpec.keyframes ?? preset?.keyframes;
    if (states && states.length >= 2) {
      const keyframes = sequence(states.map((state) => keyframeTarget(state, dir)));
      const feel = MOTION_FEEL_DEFAULTS[personality.feel];
      const duration =
        loopSpec.duration ??
        round((preset?.duration ?? feel.duration * 3) * personality.durationScale);
      const repeatDelay = loopSpec.repeatDelay ?? preset?.repeatDelay ?? 0;
      const mirror = loopSpec.mirror ?? preset?.mirror ?? false;
      const ease = preset?.transition.ease ?? 'easeInOut';
      out.loop = withSet(
        {
          keyframes,
          options: {
            duration,
            ease: easeOption(ease),
            repeat: Infinity,
            repeatType: mirror ? ('mirror' as const) : ('loop' as const),
            ...(repeatDelay > 0 ? { repeatDelay } : {}),
          },
        },
        needsPerspective(keyframes)
      );
    }
  }

  const scrollSpec = spec.scroll;
  if (scrollSpec && !reduced) {
    const preset = scrollSpec.preset ? SCROLL_PRESETS[scrollSpec.preset] : undefined;
    const ranges = scrollSpec.ranges ?? preset?.ranges;
    if (ranges && ranges.length > 0) {
      const keyframes: MotionKeyframes = {};
      for (const range of ranges) {
        const [key, from, to] = scrollRange(range.property, range.from, range.to, dir);
        keyframes[key] = [from, to];
      }
      out.scroll = { keyframes, offset: scrollSpec.offset ?? preset?.offset ?? DEFAULT_OFFSET };
    }
  }

  /* Text: a short fade of the whole element under reduced motion. */
  const textSpec = spec.text;
  if (textSpec) {
    const preset = TEXT_PRESETS[textSpec.preset ?? 'word-cascade'];
    const from = keyframeTarget(preset.from, dir);
    if (reduced) {
      out.enter ??= {
        trigger: 'inView',
        once: true,
        amount: DEFAULT_AMOUNT,
        keyframes: { opacity: [0, 1] },
        options: REDUCED_FADE,
      };
    } else {
      out.text = {
        split: textSpec.split ?? preset.split,
        keyframes: sequence([from, restOf(from)]),
        options: resolveTransition(undefined, spec.transition, preset.transition, personality),
        stagger: textSpec.stagger ?? preset.stagger,
      };
    }
  }

  /* Stagger: the children of a group play `enter` one after another. */
  if (spec.stagger && !reduced) {
    out.stagger = { each: spec.stagger.each ?? 0.08, from: spec.stagger.from ?? 'first' };
  }
  return out;
}

function pickOpacity(keyframe: MotionKeyframe): MotionKeyframe {
  return keyframe.opacity !== undefined ? { opacity: keyframe.opacity } : {};
}

function scrollRange(
  property: 'opacity' | 'x' | 'y' | 'scale' | 'rotate' | 'blur',
  from: number,
  to: number,
  dir: 'ltr' | 'rtl'
): [MotionCssProperty, MotionCssValue, MotionCssValue] {
  switch (property) {
    case 'blur':
      return ['filter', `blur(${from}px)`, `blur(${to}px)`];
    case 'x':
      return ['x', flipX(from, dir), flipX(to, dir)];
    default:
      return [property, from, to];
  }
}
