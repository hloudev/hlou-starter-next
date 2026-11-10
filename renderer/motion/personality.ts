/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { MOTION_FEELS, MOTION_REDUCED_POLICIES } from './resolve';
import { motionEaseSchema } from './schema';

/*
 * A SITE'S MOTION PERSONALITY (decision 322): its schema, stored in
 * `themes.tokens.motion`. A feel (calm, snappy, playful, luxe) sets the base
 * duration, easing and spring; `durationScale` stretches every inherited
 * duration; `ease` / `spring` override the feel's.
 *
 * What a personality does to a spec — `resolveMotion` and its helpers — is
 * `resolve.ts`'s, zod-free because the page runtime ships it in a browser
 * island (MO2). Re-exported here so `./personality` stays the one import.
 */

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const motionPersonalitySchema = z.object({
  feel: z
    .enum(MOTION_FEELS)
    .default('calm')
    .describe('The site’s feel: calm, snappy, playful or luxe.'),
  durationScale: z
    .number()
    .min(0.25)
    .max(3)
    .default(1)
    .describe('Stretches every inherited duration: 0.5 twice as fast, 2 twice as slow.'),
  ease: motionEaseSchema.optional().describe('Replaces the feel’s easing.'),
  spring: z
    .object({
      duration: z.number().min(0.1).max(5).describe('Seconds.'),
      bounce: z.number().min(0).max(1).describe('0–1.'),
    })
    .partial()
    .optional()
    .describe('Replaces the feel’s spring.'),
  reducedMotion: z
    .enum(MOTION_REDUCED_POLICIES)
    .default('reduce')
    .describe('For visitors who ask for reduced motion: reduce (a short fade) or off (no motion).'),
});
export type MotionPersonality = z.infer<typeof motionPersonalitySchema>;

export {
  DEFAULT_MOTION_PERSONALITY,
  keyframeTarget,
  MOTION_FEEL_DEFAULTS,
  MOTION_FEELS,
  MOTION_REDUCED_POLICIES,
  resolveMotion,
  resolveTransition,
} from './resolve';
export type {
  MotionCssProperty,
  MotionEnvironment,
  MotionFeel,
  MotionKeyframes,
  MotionOptions,
  MotionSet,
  MotionTarget,
  ResolvedEnter,
  ResolvedGesture,
  ResolvedLoop,
  ResolvedMotion,
  ResolvedScroll,
  ResolvedStagger,
  ResolvedText,
} from './resolve';
