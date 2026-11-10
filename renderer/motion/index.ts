/*
 * `@hlou/site-renderer/motion`: the motion spec, its presets, the site's
 * motion personality, the upgrade of the old shape and the `data-hl-motion`
 * attribute — pure and server-safe — and the runtime that plays it (MO2:
 * `runtime.ts`, `split-text.ts`, the head guard), browser-only but safe to
 * import anywhere (nothing runs at import).
 */
export {
  MOTION_CLIP_SIDES,
  MOTION_EASES,
  MOTION_LIMITS,
  MOTION_MEDIA,
  MOTION_PARTS,
  MOTION_SCROLL_OFFSETS,
  MOTION_SCROLL_PROPERTIES,
  MOTION_SPLITS,
  MOTION_STAGGER_FROM,
  MOTION_TRIGGERS,
  motionClipSchema,
  motionCubicBezierSchema,
  motionEaseSchema,
  motionEnterSchema,
  motionHoverSchema,
  motionKeyframeSchema,
  motionLoopSchema,
  motionPressSchema,
  motionScrollOffsetSchema,
  motionScrollRangeSchema,
  motionScrollSchema,
  motionSpecSchema,
  motionStaggerSchema,
  motionTextSchema,
  motionTransitionSchema,
} from './schema';
export type {
  MotionClip,
  MotionEase,
  MotionEaseName,
  MotionEnter,
  MotionHover,
  MotionKeyframe,
  MotionKeyframeKey,
  MotionLoop,
  MotionPart,
  MotionPress,
  MotionScroll,
  MotionScrollOffset,
  MotionScrollRange,
  MotionSpec,
  MotionStagger,
  MotionText,
  MotionTransition,
} from './schema';
export {
  APPEAR_PRESET_IDS,
  APPEAR_PRESETS,
  findMotionPreset,
  GESTURE_PRESETS,
  HOVER_PRESET_IDS,
  LOOP_PRESET_IDS,
  LOOP_PRESETS,
  MOTION_PRESET_CATEGORIES,
  MOTION_PRESETS,
  presetsFor,
  PRESS_PRESET_IDS,
  SCROLL_PRESET_IDS,
  SCROLL_PRESETS,
  TEXT_PRESET_IDS,
  TEXT_PRESETS,
} from './presets';
export type {
  AppearPreset,
  AppearPresetId,
  GesturePreset,
  HoverPresetId,
  LoopPreset,
  LoopPresetId,
  MotionPreset,
  MotionPresetCategory,
  MotionPresetId,
  MotionPresetTransition,
  MotionPresetTrigger,
  PressPresetId,
  ScrollPreset,
  ScrollPresetId,
  TextPreset,
  TextPresetId,
} from './presets';
export {
  DEFAULT_MOTION_PERSONALITY,
  keyframeTarget,
  MOTION_FEEL_DEFAULTS,
  MOTION_FEELS,
  MOTION_REDUCED_POLICIES,
  motionPersonalitySchema,
  resolveMotion,
  resolveTransition,
} from './personality';
export type {
  MotionCssProperty,
  MotionEnvironment,
  MotionFeel,
  MotionKeyframes,
  MotionOptions,
  MotionPersonality,
  MotionSet,
  MotionTarget,
  ResolvedEnter,
  ResolvedGesture,
  ResolvedLoop,
  ResolvedMotion,
  ResolvedScroll,
  ResolvedStagger,
  ResolvedText,
} from './personality';
export {
  isLegacyMotion,
  LEGACY_DELAY_SECONDS,
  LEGACY_HOVER_PRESETS,
  LEGACY_REVEAL_PRESETS,
  upgradeMotion,
} from './legacy';
export {
  expandMotion,
  hasMotion,
  MOTION_SHORT_KEYS,
  motionAttribute,
  parseMotionAttribute,
} from './compile';
export { readMotion, readMotionAttribute } from './read';
/* The runtime that plays it (MO2): zod-free, shipped in the `motion` island. */
export { checkMotion, checkMotionAttribute } from './check';
export {
  MOTION_FAILSAFE_MS,
  MOTION_GUARD_CSS,
  MOTION_GUARD_SCRIPT,
  MOTION_PREHIDE_SELECTOR,
  MOTION_READY_ATTRIBUTE,
  MOTION_STATE_ATTRIBUTE,
  motionGuardScript,
} from './guard';
export type { MotionPageState } from './guard';
export { createMotionRuntime } from './runtime';
/* Preview's remote control (MO7): the message protocol and its origin rule. */
export {
  listenForMotionCommands,
  MOTION_MESSAGE_TYPE,
  motionOriginAllowed,
  motionOrigins,
  originOf,
  readMotionCommand,
  readMotionReady,
  replayMotion,
} from './bridge';
export type { MotionCommand, MotionReady } from './bridge';
export type {
  MotionRuntime,
  MotionRuntimeMode,
  MotionRuntimeOptions,
  MotionRuntimePart,
} from './runtime';
export {
  currentSplit,
  SPLIT_CLASS,
  SPLIT_GROUP_CLASS,
  SPLIT_SR_CLASS,
  splitText,
} from './split-text';
export type { SplitBy, SplitText } from './split-text';
