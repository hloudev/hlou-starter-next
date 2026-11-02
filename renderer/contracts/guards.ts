/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type {
  CollectionRef,
  FormRef,
  RecordRef,
  ResolvedCollection,
  ResolvedForm,
  ResolvedMedia,
  SlotRef,
  StateRef,
} from './index';

/* The contracts' guards and constants, free of zod on purpose: the block
   markup a browser island draws (`blocks/shared.tsx`, `blocks/media.ts`)
   reads these, and the contracts' schemas would weigh half a megabyte there
   (`kernel-livelist-budget.test.ts`). `index.ts` re-exports every one. */

/* -------------------------------------------------------------------------- */
/*                                    THEME                                   */
/* -------------------------------------------------------------------------- */

export const HEX_COLOUR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Theme and block values end up INSIDE CSS the renderer writes — see
 * `hexColourSchema` in `index.ts`: the patterns are checked by the schemas on
 * write and by these guards at render.
 */
export const THEME_ROLE_KEY = /^[a-z][a-z0-9_-]{0,63}$/i;
export const FONT_FAMILY_NAME = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,119}$/u;

export function isHexColour(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOUR.test(value);
}
export function isThemeRoleKey(value: unknown): value is string {
  return typeof value === 'string' && THEME_ROLE_KEY.test(value);
}
export function isFontFamilyName(value: unknown): value is string {
  return typeof value === 'string' && FONT_FAMILY_NAME.test(value);
}

/**
 * A scheme key lands in `data-hl-scheme="<key>"` and in the selector of the
 * scheme's CSS rule (`schemesCss`): lower-case, a letter first, no quotes.
 */
export const SITE_SCHEME_KEY = /^[a-z][a-z0-9-]{0,39}$/;

export const SITE_THEME_TYPOGRAPHY_KEYS = [
  'weight',
  'size',
  'lineHeight',
  'letterSpacing',
] as const;

/* -------------------------------------------------------------------------- */
/*                                 RENDITIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * The rendition ladder, copied here because the renderer imports only `react`
 * and `zod`; a test holds the copy equal to Hlou's own. Only what serving needs: the
 * width an image rung is cut at, the height of a video rung, the bitrate of
 * an audio rung.
 */
export const MEDIA_RENDITION_PRESETS = {
  thumb: { width: 320 },
  sm: { width: 640 },
  md: { width: 1024 },
  lg: { width: 1600 },
  xl: { width: 2400 },
  poster: {},
  '480p': { height: 480 },
  '720p': { height: 720 },
  '1080p': { height: 1080 },
  '64k': { bitrate: 64_000 },
  '128k': { bitrate: 128_000 },
} as const satisfies Record<string, { width?: number; height?: number; bitrate?: number }>;

export type MediaRenditionPreset = keyof typeof MEDIA_RENDITION_PRESETS;

/** Each ladder, smallest first — the order a preset climbs to a ready rung. */
export const IMAGE_RENDITION_LADDER = ['thumb', 'sm', 'md', 'lg', 'xl'] as const;
export const VIDEO_RENDITION_LADDER = ['480p', '720p', '1080p'] as const;
export const AUDIO_RENDITION_LADDER = ['64k', '128k'] as const;

/* -------------------------------------------------------------------------- */
/*                                    REFS                                    */
/* -------------------------------------------------------------------------- */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isSlotRef(value: unknown): value is SlotRef {
  return isRecord(value) && typeof value.$slot === 'string';
}

export function isCollectionRef(value: unknown): value is CollectionRef {
  return isRecord(value) && typeof value.$collection === 'string';
}

export function isFormRef(value: unknown): value is FormRef {
  return isRecord(value) && typeof value.$form === 'string';
}

export function isRecordRef(value: unknown): value is RecordRef {
  return isRecord(value) && typeof value.$record === 'string';
}

export function isStateRef(value: unknown): value is StateRef {
  return isRecord(value) && typeof value.$state === 'string';
}

/* -------------------------------------------------------------------------- */
/*                              RESOLVED VALUES                               */
/* -------------------------------------------------------------------------- */

export function isResolvedCollection(value: unknown): value is ResolvedCollection {
  return isRecord(value) && value.$resolved === 'collection' && Array.isArray(value.records);
}

export function isResolvedForm(value: unknown): value is ResolvedForm {
  return isRecord(value) && value.$resolved === 'form' && Array.isArray(value.fields);
}

export function isResolvedMedia(value: unknown): value is ResolvedMedia {
  return isRecord(value) && typeof value.url === 'string';
}
