/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { MotionKeyframe, MotionSpec, MotionTransition } from './schema';
import { parseMotionAttribute } from './compile';
import {
  APPEAR_PRESETS,
  GESTURE_PRESETS,
  LOOP_PRESETS,
  SCROLL_PRESETS,
  TEXT_PRESETS,
} from './presets';

/*
 * THE RUNTIME'S LIGHT CHECK of a `data-hl-motion` value (MO2). The attribute
 * is written from stored props by `motionAttribute`, but a published page's
 * HTML is not trusted: before `resolveMotion` reads it, every field is
 * checked by hand — a known part, a known preset, a finite number clamped to
 * the spec's bounds, a known word. What does not pass is dropped, never
 * thrown on: a bad field costs its animation, not the page.
 *
 * ZOD-FREE: the browser island ships it. The spec's own zod schema
 * (`read.ts`) stays the editor's and the agent's; `check.test.ts` holds this
 * file's word lists to the schema's.
 */

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/* The schema's word lists, spelt again: `schema.ts` is a zod module. */
export const CHECK_EASES = [
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
export const CHECK_SCROLL_PROPERTIES = ['opacity', 'x', 'y', 'scale', 'rotate', 'blur'] as const;
const EDGES = ['start', 'center', 'end'] as const;
const MARGIN = /^(-?\d{1,4}(px|%))( -?\d{1,4}(px|%)){0,3}$/;
const PERCENT = /^-?\d{1,3}(\.\d{1,2})?%$/;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

type Bag = Record<string, unknown>;

const isRecord = (value: unknown): value is Bag =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function num(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.min(max, Math.max(min, value));
}

function word<T extends string>(list: readonly T[], value: unknown): T | undefined {
  return typeof value === 'string' && (list as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function preset<T extends string>(table: Readonly<Record<T, unknown>>, value: unknown) {
  return typeof value === 'string' && Object.hasOwn(table, value) ? (value as T) : undefined;
}

/** Drops the `undefined` fields; `undefined` when nothing is left and `keepEmpty` is off. */
function clean<T extends Bag>(value: T, keepEmpty = false): T | undefined {
  const out = Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
  return keepEmpty || Object.keys(out).length > 0 ? out : undefined;
}

function offset(value: unknown): number | string | undefined {
  if (typeof value === 'string') {
    if (!PERCENT.test(value)) return undefined;
    const n = Number.parseFloat(value);
    return n >= -200 && n <= 200 ? value : undefined;
  }
  return num(value, -2000, 2000);
}

function keyframe(value: unknown): MotionKeyframe | undefined {
  if (!isRecord(value)) return undefined;
  const clip = isRecord(value.clip)
    ? clean({
        side: word(['top', 'bottom', 'start', 'end'] as const, value.clip.side),
        amount: num(value.clip.amount, 0, 100),
      })
    : undefined;
  return clean({
    opacity: num(value.opacity, 0, 1),
    x: offset(value.x),
    y: offset(value.y),
    scale: num(value.scale, 0, 4),
    rotate: num(value.rotate, -360, 360),
    rotateX: num(value.rotateX, -180, 180),
    rotateY: num(value.rotateY, -180, 180),
    blur: num(value.blur, 0, 40),
    clip: clip?.side !== undefined && clip.amount !== undefined ? clip : undefined,
  }) as MotionKeyframe | undefined;
}

function transition(value: unknown): MotionTransition | undefined {
  if (!isRecord(value)) return undefined;
  const delay = num(value.delay, 0, 10);
  if (value.type === 'spring') {
    const stiffness = num(value.stiffness, 1, 1000);
    if (stiffness !== undefined) {
      return clean({
        type: 'spring' as const,
        stiffness,
        damping: num(value.damping, 0, 100),
        mass: num(value.mass, 0.1, 10),
        delay,
      }) as MotionTransition;
    }
    return clean({
      type: 'spring' as const,
      duration: num(value.duration, 0, 10),
      bounce: num(value.bounce, 0, 1),
      delay,
    }) as MotionTransition;
  }
  const ease =
    word(CHECK_EASES, value.ease) ??
    (Array.isArray(value.ease) &&
    value.ease.length === 4 &&
    value.ease.every((n) => typeof n === 'number' && Number.isFinite(n))
      ? ([
          num(value.ease[0], 0, 1),
          num(value.ease[1], -2, 3),
          num(value.ease[2], 0, 1),
          num(value.ease[3], -2, 3),
        ] as [number, number, number, number])
      : undefined);
  return clean({
    type: value.type === 'tween' ? ('tween' as const) : undefined,
    duration: num(value.duration, 0, 10),
    delay,
    ease,
  }) as MotionTransition | undefined;
}

const scrollOffset = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const [element, viewport, rest] = value.split(' ');
  return rest === undefined && word(EDGES, element) && word(EDGES, viewport) ? value : undefined;
};

/* -------------------------------------------------------------------------- */
/*                                   CHECK                                    */
/* -------------------------------------------------------------------------- */

/**
 * An unvalidated spec (the attribute expanded) → a spec `resolveMotion` can
 * read safely, or `null` when nothing in it would play.
 */
export function checkMotion(raw: unknown): MotionSpec | null {
  if (!isRecord(raw)) return null;
  const spec: MotionSpec = {};

  if (isRecord(raw.enter)) {
    const enter = raw.enter;
    spec.enter = clean(
      {
        preset: preset(APPEAR_PRESETS, enter.preset),
        from: keyframe(enter.from),
        trigger: word(['load', 'inView'] as const, enter.trigger),
        once: typeof enter.once === 'boolean' ? enter.once : undefined,
        amount: num(enter.amount, 0, 1),
        margin:
          typeof enter.margin === 'string' && MARGIN.test(enter.margin) ? enter.margin : undefined,
        transition: transition(enter.transition),
      },
      true
    ) as MotionSpec['enter'];
  }
  for (const part of ['hover', 'press'] as const) {
    const gesture = raw[part];
    if (!isRecord(gesture)) continue;
    const checked = clean({
      preset: preset(GESTURE_PRESETS, gesture.preset),
      to: keyframe(gesture.to),
      transition: transition(gesture.transition),
    });
    if (checked?.preset !== undefined || checked?.to !== undefined) {
      spec[part] = checked as MotionSpec['hover'];
    }
  }
  if (isRecord(raw.loop)) {
    const loop = raw.loop;
    const keyframes = Array.isArray(loop.keyframes)
      ? loop.keyframes
          .slice(0, 8)
          .map(keyframe)
          .filter((k): k is MotionKeyframe => !!k)
      : [];
    const checked = clean({
      preset: preset(LOOP_PRESETS, loop.preset),
      keyframes: keyframes.length >= 2 ? keyframes : undefined,
      duration: num(loop.duration, 0.1, 60),
      repeatDelay: num(loop.repeatDelay, 0, 30),
      mirror: typeof loop.mirror === 'boolean' ? loop.mirror : undefined,
    });
    if (checked?.preset !== undefined || checked?.keyframes !== undefined) {
      spec.loop = checked as MotionSpec['loop'];
    }
  }
  if (isRecord(raw.scroll)) {
    const scroll = raw.scroll;
    const ranges = Array.isArray(scroll.ranges)
      ? scroll.ranges.slice(0, 6).flatMap((range: unknown) => {
          if (!isRecord(range)) return [];
          const property = word(CHECK_SCROLL_PROPERTIES, range.property);
          const from = num(range.from, -2000, 2000);
          const to = num(range.to, -2000, 2000);
          return property && from !== undefined && to !== undefined ? [{ property, from, to }] : [];
        })
      : [];
    const pair =
      Array.isArray(scroll.offset) && scroll.offset.length === 2
        ? scroll.offset.map(scrollOffset)
        : [];
    const checked = clean({
      preset: preset(SCROLL_PRESETS, scroll.preset),
      ranges: ranges.length > 0 ? ranges : undefined,
      offset: pair.length === 2 && pair.every(Boolean) ? pair : undefined,
    });
    if (checked?.preset !== undefined || checked?.ranges !== undefined) {
      spec.scroll = checked as MotionSpec['scroll'];
    }
  }
  if (isRecord(raw.text)) {
    spec.text = clean(
      {
        split: word(['words', 'chars', 'lines'] as const, raw.text.split),
        stagger: num(raw.text.stagger, 0, 1),
        preset: preset(TEXT_PRESETS, raw.text.preset),
      },
      true
    ) as MotionSpec['text'];
  }
  if (isRecord(raw.stagger)) {
    spec.stagger = clean(
      {
        each: num(raw.stagger.each, 0, 2),
        from: word(['first', 'last', 'center'] as const, raw.stagger.from),
      },
      true
    ) as MotionSpec['stagger'];
  }
  const shared = transition(raw.transition);
  if (shared) spec.transition = shared;
  const media = word(['all', 'no-mobile', 'desktop'] as const, raw.media);
  if (media) spec.media = media;

  const parts = Object.keys(spec).filter((key) => key !== 'transition' && key !== 'media');
  return parts.length > 0 ? spec : null;
}

/** A `data-hl-motion` value → a checked spec, or `null`. */
export function checkMotionAttribute(attribute: string | null | undefined): MotionSpec | null {
  return checkMotion(parseMotionAttribute(attribute));
}
