/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { MotionEase, MotionKeyframe, MotionScrollOffset, MotionScrollRange } from './schema';

/*
 * THE PRESETS (M47): named motions, as data — a keyframe and a transition
 * hint each, never code. A spec names one (`enter.preset: "rise"`) and may
 * still override any part of it. Their durations are relative to the site's
 * motion personality (`personality.ts`), so one setting restyles them all.
 *
 * Six categories, the editor's gallery tabs: appear, hover, press, loop,
 * scroll, text. Hover presets are valid on press too.
 */

/* -------------------------------------------------------------------------- */
/*                                    IDS                                     */
/* -------------------------------------------------------------------------- */

export const APPEAR_PRESET_IDS = [
  'fade',
  'rise',
  'fall',
  'slide-start',
  'slide-end',
  'zoom',
  'pop',
  'blur-in',
  'clip-up',
  'flip',
  'tilt',
] as const;
export const HOVER_PRESET_IDS = ['lift', 'enlarge', 'dim', 'tilt-3d'] as const;
export const PRESS_PRESET_IDS = ['press-shrink'] as const;
export const LOOP_PRESET_IDS = ['float', 'pulse', 'spin', 'wiggle'] as const;
export const SCROLL_PRESET_IDS = [
  'parallax-slow',
  'parallax-fast',
  'fade-through',
  'scale-through',
] as const;
export const TEXT_PRESET_IDS = ['word-cascade', 'char-rise', 'line-reveal'] as const;

export type AppearPresetId = (typeof APPEAR_PRESET_IDS)[number];
export type HoverPresetId = (typeof HOVER_PRESET_IDS)[number];
export type PressPresetId = (typeof PRESS_PRESET_IDS)[number] | HoverPresetId;
export type LoopPresetId = (typeof LOOP_PRESET_IDS)[number];
export type ScrollPresetId = (typeof SCROLL_PRESET_IDS)[number];
export type TextPresetId = (typeof TEXT_PRESET_IDS)[number];
export type MotionPresetId =
  AppearPresetId | PressPresetId | LoopPresetId | ScrollPresetId | TextPresetId;

export const MOTION_PRESET_CATEGORIES = [
  'appear',
  'hover',
  'press',
  'loop',
  'scroll',
  'text',
] as const;
export type MotionPresetCategory = (typeof MOTION_PRESET_CATEGORIES)[number];

/** The spec part a preset is set on (`enter.preset`, `hover.preset`…). */
export type MotionPresetTrigger = 'enter' | 'hover' | 'press' | 'loop' | 'scroll' | 'text';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

/**
 * How a preset moves, relative to the personality: `durationFactor` × the
 * feel's base duration (× its `durationScale`); `ease` and `bounce` replace
 * the personality's own only where the preset needs its character (a pop
 * bounces, a spin is linear).
 */
export type MotionPresetTransition = {
  type: 'tween' | 'spring';
  durationFactor?: number;
  ease?: MotionEase;
  bounce?: number;
};

type PresetBase<C extends MotionPresetCategory, I extends string> = {
  id: I;
  category: C;
  /** Its name in the editor: `Canvas.motion.presets.<id>` (fr, en, ar). */
  labelKey: `Canvas.motion.presets.${I}`;
  transition: MotionPresetTransition;
};

export type AppearPreset = PresetBase<'appear', AppearPresetId> & {
  /** The state it appears from. */
  from: MotionKeyframe;
};
export type GesturePreset = PresetBase<'hover' | 'press', HoverPresetId | PressPresetId> & {
  /** The state it goes to. */
  to: MotionKeyframe;
};
export type LoopPreset = PresetBase<'loop', LoopPresetId> & {
  keyframes: MotionKeyframe[];
  /** Seconds for one cycle, before the personality's `durationScale`. */
  duration: number;
  repeatDelay: number;
  mirror: boolean;
};
export type ScrollPreset = PresetBase<'scroll', ScrollPresetId> & {
  ranges: MotionScrollRange[];
  offset: [MotionScrollOffset, MotionScrollOffset];
};
export type TextPreset = PresetBase<'text', TextPresetId> & {
  split: 'words' | 'chars' | 'lines';
  /** Seconds between pieces. */
  stagger: number;
  /** The state each piece appears from. */
  from: MotionKeyframe;
};
export type MotionPreset = AppearPreset | GesturePreset | LoopPreset | ScrollPreset | TextPreset;

/* -------------------------------------------------------------------------- */
/*                                    DATA                                    */
/* -------------------------------------------------------------------------- */

const label = <I extends string>(id: I) => `Canvas.motion.presets.${id}` as const;

const TWEEN: MotionPresetTransition = { type: 'tween', durationFactor: 1 };

export const APPEAR_PRESETS: Record<AppearPresetId, AppearPreset> = {
  fade: {
    id: 'fade',
    category: 'appear',
    labelKey: label('fade'),
    from: { opacity: 0 },
    transition: TWEEN,
  },
  /* `fade-up` before M47: the same 24 px rise. */
  rise: {
    id: 'rise',
    category: 'appear',
    labelKey: label('rise'),
    from: { opacity: 0, y: 24 },
    transition: TWEEN,
  },
  fall: {
    id: 'fall',
    category: 'appear',
    labelKey: label('fall'),
    from: { opacity: 0, y: -24 },
    transition: TWEEN,
  },
  'slide-start': {
    id: 'slide-start',
    category: 'appear',
    labelKey: label('slide-start'),
    from: { opacity: 0, x: -48 },
    transition: TWEEN,
  },
  'slide-end': {
    id: 'slide-end',
    category: 'appear',
    labelKey: label('slide-end'),
    from: { opacity: 0, x: 48 },
    transition: TWEEN,
  },
  /* `scale-in` before M47: the same 0.96. */
  zoom: {
    id: 'zoom',
    category: 'appear',
    labelKey: label('zoom'),
    from: { opacity: 0, scale: 0.96 },
    transition: TWEEN,
  },
  pop: {
    id: 'pop',
    category: 'appear',
    labelKey: label('pop'),
    from: { opacity: 0, scale: 0.6 },
    transition: { type: 'spring', durationFactor: 0.9, bounce: 0.45 },
  },
  'blur-in': {
    id: 'blur-in',
    category: 'appear',
    labelKey: label('blur-in'),
    from: { opacity: 0, blur: 12 },
    transition: { type: 'tween', durationFactor: 1.2 },
  },
  'clip-up': {
    id: 'clip-up',
    category: 'appear',
    labelKey: label('clip-up'),
    from: { clip: { side: 'top', amount: 100 } },
    transition: { type: 'tween', durationFactor: 1.3, ease: [0.65, 0, 0.35, 1] },
  },
  flip: {
    id: 'flip',
    category: 'appear',
    labelKey: label('flip'),
    from: { opacity: 0, rotateX: -80 },
    transition: { type: 'spring', durationFactor: 1, bounce: 0.2 },
  },
  tilt: {
    id: 'tilt',
    category: 'appear',
    labelKey: label('tilt'),
    from: { opacity: 0, rotate: -6, y: 16 },
    transition: TWEEN,
  },
};

const GESTURE: MotionPresetTransition = { type: 'tween', durationFactor: 0.4, ease: 'easeOut' };

export const GESTURE_PRESETS: Record<HoverPresetId | PressPresetId, GesturePreset> = {
  /* The pre-M47 hovers, same values: lift 4 px, enlarge 1.02, dim 0.8. */
  lift: {
    id: 'lift',
    category: 'hover',
    labelKey: label('lift'),
    to: { y: -4 },
    transition: GESTURE,
  },
  enlarge: {
    id: 'enlarge',
    category: 'hover',
    labelKey: label('enlarge'),
    to: { scale: 1.02 },
    transition: GESTURE,
  },
  dim: {
    id: 'dim',
    category: 'hover',
    labelKey: label('dim'),
    to: { opacity: 0.8 },
    transition: GESTURE,
  },
  'tilt-3d': {
    id: 'tilt-3d',
    category: 'hover',
    labelKey: label('tilt-3d'),
    to: { rotateX: 6, rotateY: -6, scale: 1.02 },
    transition: { type: 'spring', durationFactor: 0.5, bounce: 0.25 },
  },
  'press-shrink': {
    id: 'press-shrink',
    category: 'press',
    labelKey: label('press-shrink'),
    to: { scale: 0.96 },
    transition: { type: 'spring', durationFactor: 0.3, bounce: 0.3 },
  },
};

export const LOOP_PRESETS: Record<LoopPresetId, LoopPreset> = {
  float: {
    id: 'float',
    category: 'loop',
    labelKey: label('float'),
    keyframes: [{ y: 0 }, { y: -8 }],
    duration: 2.4,
    repeatDelay: 0,
    mirror: true,
    transition: { type: 'tween', ease: 'easeInOut' },
  },
  pulse: {
    id: 'pulse',
    category: 'loop',
    labelKey: label('pulse'),
    keyframes: [{ scale: 1 }, { scale: 1.05 }],
    duration: 1.2,
    repeatDelay: 0,
    mirror: true,
    transition: { type: 'tween', ease: 'easeInOut' },
  },
  spin: {
    id: 'spin',
    category: 'loop',
    labelKey: label('spin'),
    keyframes: [{ rotate: 0 }, { rotate: 360 }],
    duration: 8,
    repeatDelay: 0,
    mirror: false,
    transition: { type: 'tween', ease: 'linear' },
  },
  wiggle: {
    id: 'wiggle',
    category: 'loop',
    labelKey: label('wiggle'),
    keyframes: [{ rotate: 0 }, { rotate: -4 }, { rotate: 4 }, { rotate: -2 }, { rotate: 0 }],
    duration: 0.6,
    repeatDelay: 2,
    mirror: false,
    transition: { type: 'tween', ease: 'easeInOut' },
  },
};

export const SCROLL_PRESETS: Record<ScrollPresetId, ScrollPreset> = {
  'parallax-slow': {
    id: 'parallax-slow',
    category: 'scroll',
    labelKey: label('parallax-slow'),
    ranges: [{ property: 'y', from: 40, to: -40 }],
    offset: ['start end', 'end start'],
    transition: { type: 'tween', ease: 'linear' },
  },
  'parallax-fast': {
    id: 'parallax-fast',
    category: 'scroll',
    labelKey: label('parallax-fast'),
    ranges: [{ property: 'y', from: 120, to: -120 }],
    offset: ['start end', 'end start'],
    transition: { type: 'tween', ease: 'linear' },
  },
  'fade-through': {
    id: 'fade-through',
    category: 'scroll',
    labelKey: label('fade-through'),
    ranges: [{ property: 'opacity', from: 0, to: 1 }],
    offset: ['start end', 'center center'],
    transition: { type: 'tween', ease: 'linear' },
  },
  'scale-through': {
    id: 'scale-through',
    category: 'scroll',
    labelKey: label('scale-through'),
    ranges: [{ property: 'scale', from: 0.85, to: 1 }],
    offset: ['start end', 'center center'],
    transition: { type: 'tween', ease: 'linear' },
  },
};

export const TEXT_PRESETS: Record<TextPresetId, TextPreset> = {
  'word-cascade': {
    id: 'word-cascade',
    category: 'text',
    labelKey: label('word-cascade'),
    split: 'words',
    stagger: 0.06,
    from: { opacity: 0, y: 12 },
    transition: { type: 'tween', durationFactor: 0.8 },
  },
  'char-rise': {
    id: 'char-rise',
    category: 'text',
    labelKey: label('char-rise'),
    split: 'chars',
    stagger: 0.02,
    from: { opacity: 0, y: '60%' },
    transition: { type: 'tween', durationFactor: 0.6 },
  },
  'line-reveal': {
    id: 'line-reveal',
    category: 'text',
    labelKey: label('line-reveal'),
    split: 'lines',
    stagger: 0.12,
    from: { clip: { side: 'bottom', amount: 100 }, y: '30%' },
    transition: { type: 'tween', durationFactor: 1, ease: [0.65, 0, 0.35, 1] },
  },
};

/** Every preset, in gallery order: appear, hover, press, loop, scroll, text. */
export const MOTION_PRESETS: readonly MotionPreset[] = [
  ...Object.values(APPEAR_PRESETS),
  ...Object.values(GESTURE_PRESETS),
  ...Object.values(LOOP_PRESETS),
  ...Object.values(SCROLL_PRESETS),
  ...Object.values(TEXT_PRESETS),
];

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

/** The presets a spec part accepts, in gallery order. Hover presets work on press too. */
export function presetsFor(trigger: 'enter'): readonly AppearPreset[];
export function presetsFor(trigger: 'hover' | 'press'): readonly GesturePreset[];
export function presetsFor(trigger: 'loop'): readonly LoopPreset[];
export function presetsFor(trigger: 'scroll'): readonly ScrollPreset[];
export function presetsFor(trigger: 'text'): readonly TextPreset[];
export function presetsFor(trigger: MotionPresetTrigger): readonly MotionPreset[];
export function presetsFor(trigger: MotionPresetTrigger): readonly MotionPreset[] {
  switch (trigger) {
    case 'enter':
      return Object.values(APPEAR_PRESETS);
    case 'hover':
      return HOVER_PRESET_IDS.map((id) => GESTURE_PRESETS[id]);
    case 'press':
      return [...PRESS_PRESET_IDS, ...HOVER_PRESET_IDS].map((id) => GESTURE_PRESETS[id]);
    case 'loop':
      return Object.values(LOOP_PRESETS);
    case 'scroll':
      return Object.values(SCROLL_PRESETS);
    case 'text':
      return Object.values(TEXT_PRESETS);
  }
}

/** One preset by id, whatever its category; `undefined` for an unknown id. */
export function findMotionPreset(id: unknown): MotionPreset | undefined {
  return typeof id === 'string' ? MOTION_PRESETS.find((preset) => preset.id === id) : undefined;
}
