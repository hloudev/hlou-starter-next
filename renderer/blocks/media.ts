/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type {
  MediaRenditionPreset,
  MediaRenditionRef,
  MediaRenditions,
  ResolvedMedia,
} from '../contracts';

/* The zod-free half of the contracts: this module ships in browser islands. */
import {
  AUDIO_RENDITION_LADDER,
  IMAGE_RENDITION_LADDER,
  MEDIA_RENDITION_PRESETS,
  VIDEO_RENDITION_LADDER,
} from '../contracts/guards';

/* -------------------------------------------------------------------------- */
/*                                    SIZES                                   */
/* -------------------------------------------------------------------------- */

/**
 * The `sizes` attribute per layout: how wide the browser should
 * expect an image to be drawn, so it picks the smallest rung of the
 * `srcset` that covers it. One table, so every block says the same thing:
 *
 * - `full` — a full-bleed section (hero overlay, a `full` image): the viewport;
 * - `content` — the site's content column (`--site-content-max`, 1180px);
 * - `narrow` — a reading-width figure (`max-w-[68ch]`, ≈ 680px);
 * - `half` — one side of a split (hero, media + text): half the viewport
 *   from `md`, the viewport below;
 * - `third` / `quarter` — a card or gallery cell in a 3- or 4-column grid;
 * - `logo` — a header / footer / logo-cloud mark, a small fixed box;
 * - `icon` — an icon-sized thumbnail.
 */
export const MEDIA_SIZES_ATTR = {
  full: '100vw',
  content: '(min-width: 1180px) 1180px, 100vw',
  narrow: '(min-width: 720px) 680px, 100vw',
  half: '(min-width: 768px) 50vw, 100vw',
  third: '(min-width: 768px) 33vw, 100vw',
  quarter: '(min-width: 768px) 25vw, 50vw',
  logo: '160px',
  icon: '64px',
} as const;
export type MediaSizesKey = keyof typeof MEDIA_SIZES_ATTR;

/** A responsive count (`{ base: 1, md: 3 }`) at its widest breakpoint. */
export function widestCount(value: unknown, fallback: number): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'object' || value === null) return fallback;
  const counts = Object.values(value).flatMap((raw) => {
    const count = typeof raw === 'string' ? Number(raw) : raw;
    return typeof count === 'number' && Number.isFinite(count) ? [count] : [];
  });
  return counts.length > 0 ? Math.max(...counts) : fallback;
}

/** A grid of `columns` cells: the `sizes` of one cell. */
export function columnsSizes(columns: number): string {
  if (columns <= 1) return MEDIA_SIZES_ATTR.content;
  if (columns === 2) return MEDIA_SIZES_ATTR.half;
  if (columns === 3) return MEDIA_SIZES_ATTR.third;
  return MEDIA_SIZES_ATTR.quarter;
}

/* -------------------------------------------------------------------------- */
/*                                   PICKING                                  */
/* -------------------------------------------------------------------------- */

const LADDERS: readonly (readonly MediaRenditionPreset[])[] = [
  IMAGE_RENDITION_LADDER,
  VIDEO_RENDITION_LADDER,
  AUDIO_RENDITION_LADDER,
];

/**
 * `pickRendition`'s rule over the rungs a
 * value carries — every one of them ready: that rung, else the nearest larger
 * one of its ladder, else `null` (the original).
 */
export function pickServedRendition(
  renditions: MediaRenditions | undefined,
  preset: MediaRenditionPreset
): (MediaRenditionRef & { preset: MediaRenditionPreset }) | null {
  if (!renditions) return null;
  const exact = renditions[preset];
  if (exact) return { ...exact, preset };
  const ladder = LADDERS.find((rungs) => rungs.includes(preset));
  if (!ladder) return null;
  for (const larger of ladder.slice(ladder.indexOf(preset) + 1)) {
    const found = renditions[larger];
    if (found) return { ...found, preset: larger };
  }
  return null;
}

function isImageRung(size: string): size is (typeof IMAGE_RENDITION_LADDER)[number] {
  return (IMAGE_RENDITION_LADDER as readonly string[]).includes(size);
}

export function isGif(media: Pick<ResolvedMedia, 'mime'>): boolean {
  return media.mime?.toLowerCase() === 'image/gif';
}

/* -------------------------------------------------------------------------- */
/*                                   IMAGES                                   */
/* -------------------------------------------------------------------------- */

export type MediaImgAttrs = {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  decoding: 'async';
  loading?: 'lazy';
  fetchPriority?: 'high';
  /** A GIF served animated: the still frame for `prefers-reduced-motion`. */
  reducedMotionSrc?: string;
};

/**
 * Everything an `<img>` of a media value needs:
 *
 * - `size: auto` (or absent) — `src` is the `md` rung (else the nearest ready
 *   larger one, else the original), `srcset` every ready rung at its width
 *   plus the original at its own, and `sizes` from the block;
 * - a rung — that rung by `pickServedRendition`, no `srcset`;
 * - `original` — the uploaded file, the only choice for older media;
 * - `width` / `height` always when known (the rung's own when one is served),
 *   `decoding="async"`, and `loading="lazy"` unless `priority` — the hero's
 *   media and the first figure above the fold — which asks `fetchpriority="high"`;
 * - a GIF on `auto` serves its animated-WebP rungs, with its `poster` for a
 *   visitor who asked for reduced motion.
 */
export function mediaImgAttrs(
  media: ResolvedMedia,
  options: {
    sizes?: string;
    priority?: boolean;
    /** Not lazy, without asking for priority either (a header logo). */
    eager?: boolean;
  } = {}
): MediaImgAttrs {
  const base = {
    decoding: 'async' as const,
    ...(options.priority
      ? { fetchPriority: 'high' as const }
      : options.eager
        ? {}
        : { loading: 'lazy' as const }),
  };
  const original = { src: media.url, width: media.width, height: media.height };
  const size = media.size ?? 'auto';
  const renditions = media.renditions;
  if (size === 'original' || !renditions) return { ...base, ...original };

  if (isImageRung(size)) {
    const rung = pickServedRendition(renditions, size);
    if (!rung) return { ...base, ...original };
    return { ...base, ...served(rung, media) };
  }

  /* `auto` — and an AV rung on an image, which means nothing here. */
  const rungs = IMAGE_RENDITION_LADDER.flatMap((preset) => {
    const ref = renditions[preset];
    return ref ? [{ ...ref, preset }] : [];
  });
  const poster = isGif(media) ? renditions.poster?.url : undefined;
  if (rungs.length === 0) {
    return { ...base, ...original, ...(poster ? { reducedMotionSrc: poster } : {}) };
  }
  const candidates = rungs.map(
    (rung) => `${rung.url} ${rung.width ?? MEDIA_RENDITION_PRESETS[rung.preset].width}w`
  );
  /* A GIF's original is the heavy animation the rungs exist to avoid. */
  if (media.width && !isGif(media)) candidates.push(`${media.url} ${media.width}w`);
  const src = pickServedRendition(renditions, 'md') ?? rungs[rungs.length - 1];
  return {
    ...base,
    src: src?.url ?? media.url,
    width: media.width ?? src?.width,
    height: media.height ?? src?.height,
    srcSet: candidates.join(', '),
    ...(options.sizes ? { sizes: options.sizes } : {}),
    ...(poster ? { reducedMotionSrc: poster } : {}),
  };
}

/** One rung's URL and measures; the value's own when the rung has none. */
function served(rung: MediaRenditionRef, media: ResolvedMedia) {
  return {
    src: rung.url,
    width: rung.width ?? media.width,
    height: rung.height ?? (rung.width ? undefined : media.height),
  };
}

/**
 * A surface's background (`style.surface.image`): `image-set()` over the
 * `lg` and `xl` rungs on `auto` (a section background is drawn wide), the
 * chosen rung otherwise, the original on `original` or with no rungs. The
 * URLs were checked by the caller.
 */
export function surfaceImageUrls(media: ResolvedMedia): string[] {
  const size = media.size ?? 'auto';
  const renditions = media.renditions;
  if (size === 'original' || !renditions) return [media.url];
  if (isImageRung(size)) return [pickServedRendition(renditions, size)?.url ?? media.url];
  const large = pickServedRendition(renditions, 'lg');
  const xl = renditions.xl;
  const urls = [large?.url, xl?.url].filter((url): url is string => Boolean(url));
  return urls.length > 0 ? [...new Set(urls)] : [media.url];
}

/* -------------------------------------------------------------------------- */
/*                               VIDEO AND AUDIO                              */
/* -------------------------------------------------------------------------- */

export type MediaSource = { src: string; type?: string };

/**
 * A library video's `<source>` list, best first: on `auto`
 * the 720p rung, then 480p, then the original; a rung caps the ladder (that
 * rung, the smaller ones, then the original); `original` alone. The poster
 * is the `poster` rung when there is one.
 */
export function videoSources(media: ResolvedMedia): { sources: MediaSource[]; poster?: string } {
  const renditions = media.renditions ?? {};
  const size = media.size ?? 'auto';
  const original: MediaSource = { src: media.url, ...(media.mime ? { type: media.mime } : {}) };
  const poster = renditions.poster?.url;
  if (size === 'original') return { sources: [original], ...(poster ? { poster } : {}) };
  const cap = (VIDEO_RENDITION_LADDER as readonly string[]).includes(size)
    ? (size as (typeof VIDEO_RENDITION_LADDER)[number])
    : '720p';
  const ladder = VIDEO_RENDITION_LADDER.slice(0, VIDEO_RENDITION_LADDER.indexOf(cap) + 1).reverse();
  return {
    sources: [...rungSources(renditions, ladder), original],
    ...(poster ? { poster } : {}),
  };
}

/** A library audio file's `<source>` list: `auto` = 128k then 64k, then the original. */
export function audioSources(media: ResolvedMedia): MediaSource[] {
  const renditions = media.renditions ?? {};
  const size = media.size ?? 'auto';
  const original: MediaSource = { src: media.url, ...(media.mime ? { type: media.mime } : {}) };
  if (size === 'original') return [original];
  const cap = size === '64k' ? '64k' : '128k';
  const ladder = AUDIO_RENDITION_LADDER.slice(0, AUDIO_RENDITION_LADDER.indexOf(cap) + 1).reverse();
  return [...rungSources(renditions, ladder), original];
}

function rungSources(
  renditions: MediaRenditions,
  ladder: readonly MediaRenditionPreset[]
): MediaSource[] {
  return ladder.flatMap((preset) => {
    const ref = renditions[preset];
    return ref ? [{ src: ref.url, ...(ref.mime ? { type: ref.mime } : {}) }] : [];
  });
}
