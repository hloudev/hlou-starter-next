/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { PositionAnchor, PositionValue } from '../style-props';
import type { Breakpoint } from '../tw';

import {
  POSITION_ANCHORS,
  POSITION_OFFSET_MAX,
  POSITION_WIDTH_MAX,
  POSITION_Z_MAX,
} from '../style-props';
import { BREAKPOINTS } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   PURPOSE                                  */
/* -------------------------------------------------------------------------- */

/**
 * A free element's position → the CSS variables its fixed utilities read.
 *
 * The element carries one class set (`start-(--fs) top-(--ft) …`) and one
 * `float-at-<bp>` utility per breakpoint it has a value for
 * (`styles/tailwind.css`); each of those points the unsuffixed variables at
 * the breakpoint's own (`--fs-md` …), which the inline style writes here.
 * Values are clamped numbers and enum-derived keywords: nothing stored
 * reaches the style attribute as a string.
 *
 * Shared with the Design canvas, which rewrites the same variables live
 * while an element is dragged.
 */

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

type Horizontal = 'start' | 'center' | 'end';
type Vertical = 'top' | 'middle' | 'bottom';

const FLOAT_AT: Record<Breakpoint, string> = {
  base: 'float-at-base',
  md: 'md:float-at-md',
  lg: 'lg:float-at-lg',
  xl: 'xl:float-at-xl',
};

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(min, Math.round(value)), max);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function splitAnchor(anchor: PositionAnchor): { h: Horizontal; v: Vertical } {
  const [v, h] = anchor.split('-') as [Vertical, Horizontal];
  return { h, v };
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

export const DEFAULT_POSITION: PositionValue = {
  anchor: 'top-start',
  x: 24,
  y: 24,
  width: 240,
  z: 1,
};

/** A stored position, clamped field by field; anything unusable → default. */
export function readPosition(raw: unknown): PositionValue | undefined {
  const record = asRecord(raw);
  if (!record) return undefined;
  const anchor = (POSITION_ANCHORS as readonly unknown[]).includes(record.anchor)
    ? (record.anchor as PositionAnchor)
    : DEFAULT_POSITION.anchor;
  return {
    anchor,
    x: clampInt(record.x, -POSITION_OFFSET_MAX, POSITION_OFFSET_MAX, 0),
    y: clampInt(record.y, -POSITION_OFFSET_MAX, POSITION_OFFSET_MAX, 0),
    width: clampInt(record.width, 0, POSITION_WIDTH_MAX, 0),
    z: clampInt(record.z, 0, POSITION_Z_MAX, 0),
  };
}

/** One breakpoint's variables, suffixed with that breakpoint. */
export function positionVarsAt(
  value: PositionValue,
  bp: Breakpoint,
  dir: 'ltr' | 'rtl'
): Record<string, string> {
  const { h, v } = splitAnchor(value.anchor);
  const x = `${value.x}px`;
  const y = `${value.y}px`;
  return {
    [`--fs-${bp}`]: h === 'start' ? x : h === 'center' ? `calc(50% + ${x})` : 'auto',
    [`--fe-${bp}`]: h === 'end' ? x : 'auto',
    [`--ft-${bp}`]: v === 'top' ? y : v === 'middle' ? `calc(50% + ${y})` : 'auto',
    [`--fb-${bp}`]: v === 'bottom' ? y : 'auto',
    /* Centring pulls the element back by half its width toward the inline
       start — leftward in LTR, rightward in RTL. */
    [`--ftx-${bp}`]: h === 'center' ? (dir === 'rtl' ? '50%' : '-50%') : '0px',
    [`--fty-${bp}`]: v === 'middle' ? '-50%' : '0px',
    [`--fw-${bp}`]: value.width > 0 ? `${value.width}px` : 'auto',
    [`--fz-${bp}`]: String(value.z),
  };
}

/** Every stored breakpoint's variables, and the utilities that switch them. */
export function positionStyle(
  raw: unknown,
  dir: 'ltr' | 'rtl'
): { vars: Record<string, string>; classes: string[] } {
  const record = asRecord(raw);
  const vars: Record<string, string> = {};
  const classes: string[] = [];
  for (const bp of BREAKPOINTS) {
    const value = readPosition(record?.[bp]) ?? (bp === 'base' ? DEFAULT_POSITION : undefined);
    if (!value) continue;
    Object.assign(vars, positionVarsAt(value, bp, dir));
    classes.push(FLOAT_AT[bp]);
  }
  return { vars, classes };
}

/**
 * A pointer drag of (`dx`, `dy`) screen px → the new offsets. `x` counts from
 * the anchor's side toward the inside, so its sign flips for an `end` anchor
 * and again under RTL; `y` flips for a `bottom` anchor.
 */
export function dragPosition(
  value: PositionValue,
  dx: number,
  dy: number,
  dir: 'ltr' | 'rtl'
): PositionValue {
  const { h, v } = splitAnchor(value.anchor);
  const inline = dir === 'rtl' ? -dx : dx;
  const nextX = h === 'end' ? value.x - inline : value.x + inline;
  const nextY = v === 'bottom' ? value.y - dy : value.y + dy;
  return {
    ...value,
    x: clampInt(nextX, -POSITION_OFFSET_MAX, POSITION_OFFSET_MAX, 0),
    y: clampInt(nextY, -POSITION_OFFSET_MAX, POSITION_OFFSET_MAX, 0),
  };
}
