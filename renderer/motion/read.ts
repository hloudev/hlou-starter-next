/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { MotionSpec } from './schema';
import { parseMotionAttribute } from './compile';
import { upgradeMotion } from './legacy';
import { motionSpecSchema } from './schema';

/*
 * Reading a motion back, validated by the spec's schema (zod): the editor and
 * the agent's side. `compile.ts` is the zod-free half that renders it.
 */

/** A stored `style.motion` (old or new shape) → the spec, or `null` when it does not parse. */
export function readMotion(raw: unknown): MotionSpec | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const parsed = motionSpecSchema.safeParse(upgradeMotion(raw));
  return parsed.success ? parsed.data : null;
}

/** A `data-hl-motion` value → the spec, or `null` when it is not one. */
export function readMotionAttribute(attribute: string | null | undefined): MotionSpec | null {
  const raw = parseMotionAttribute(attribute);
  if (raw === null) return null;
  const parsed = motionSpecSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
