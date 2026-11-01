/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { VideoProps } from './schema';

import { videoSources } from '../media';
import { blockParts, literal, literalMedia } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

type VideoSource =
  { kind: 'embed'; src: string } | { kind: 'file'; src: string } | { kind: 'none' };

const YOUTUBE_ID = /^[\w-]{6,}$/;

/** This site's own media: a build's `/media/…` copy, or the app's `/api/v1/…` routes. */
const OWN_MEDIA = /^\/(?:media|api\/v1)\/[^\s"'<>]*$/;

/**
 * Only four things ever reach the page: a YouTube or Vimeo player on its
 * privacy-enhanced embed origin, a direct media file over https, or this
 * site's own media by a root-relative URL (`/media/…`, `/api/v1/…` — M37-06).
 * Anything else — a random site, a `javascript:` URL — draws the placeholder.
 */
export function resolveVideoSource(url: string): VideoSource {
  const trimmed = url.trim();
  if (OWN_MEDIA.test(trimmed)) return { kind: 'file', src: trimmed };
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { kind: 'none' };
  }
  if (parsed.protocol !== 'https:') return { kind: 'none' };
  const host = parsed.hostname.replace(/^www\./, '');

  if (host === 'youtu.be' || host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const fromPath = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1];
    const id =
      host === 'youtu.be' ? parsed.pathname.slice(1) : (parsed.searchParams.get('v') ?? fromPath);
    if (id && YOUTUBE_ID.test(id)) {
      return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    return { kind: 'none' };
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = parsed.pathname.match(/(\d{6,})/)?.[1];
    return id ? { kind: 'embed', src: `https://player.vimeo.com/video/${id}` } : { kind: 'none' };
  }
  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(parsed.pathname)) {
    return { kind: 'file', src: parsed.toString() };
  }
  return { kind: 'none' };
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/* A portrait clip stays phone-sized, centred. */
const RATIO: Record<VideoProps['ratio'], string> = {
  wide: 'aspect-video',
  square: 'aspect-square',
  portrait: 'mx-auto aspect-[9/16] max-w-[420px]',
};

/* `wide` gives up its cap nested in a layout block, whose container
   already has one. */
const WIDTH: Record<VideoProps['width'], string> = {
  narrow: 'max-w-[68ch]',
  wide: 'max-w-site-content in-[.hl-slot]:max-w-none',
  full: 'max-w-none',
};

const PLAYER = 'block size-full border-0';

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function VideoBlock(props: BlockProps<VideoProps>): ReactElement {
  /* A primitive on its own row breathes less than a composed section. */
  const { root, el } = blockParts(props, 'video', '[--site-pad-y:18px]');
  /* A library video wins over the link (M37-06). */
  const media = literalMedia(props.media);
  const source = resolveVideoSource(props.url);
  const title = literal(props.title, '') || undefined;

  function getPlayer() {
    if (media) {
      const { sources, poster } = videoSources(media);
      return (
        <video
          className={cx(PLAYER, 'object-contain')}
          title={title}
          poster={poster}
          width={media.width}
          height={media.height}
          controls
          playsInline
          preload="metadata"
        >
          {sources.map((entry) => (
            <source key={entry.src} src={entry.src} type={entry.type} />
          ))}
        </video>
      );
    }
    if (source.kind === 'embed') {
      return (
        <iframe
          className={PLAYER}
          src={source.src}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      );
    }
    if (source.kind === 'file') {
      return (
        <video
          className={PLAYER}
          src={source.src}
          title={title}
          controls
          playsInline
          preload="metadata"
        />
      );
    }
    return (
      <span
        className="absolute start-3 bottom-3 font-mono text-[10px] tracking-[0.06em] text-site-on-ink-muted"
        aria-hidden="true"
      >
        media / video
      </span>
    );
  }

  return (
    <div {...root}>
      <div className={cx('mx-auto w-full', WIDTH[props.width] ?? WIDTH.wide)}>
        <div
          {...el(
            'url',
            cx(
              'relative overflow-hidden rounded-site bg-site-ink',
              RATIO[props.ratio] ?? RATIO.wide
            )
          )}
        >
          {getPlayer()}
        </div>
      </div>
    </div>
  );
}
