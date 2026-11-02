/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { AudioProps } from './schema';

import { audioSources } from '../media';
import { blockParts, literal, literalMedia } from '../shared';

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * A library audio file in a card: its title, the browser's own player with
 * one `<source>` per rung (`128k`, `64k`, then the original), and a caption. `preload="metadata"`: the length shows, the bytes wait
 * for play. Controls always on, never autoplay.
 */
export function AudioBlock(props: BlockProps<AudioProps>): ReactElement {
  /* A primitive on its own row breathes less than a composed section. */
  const { root, el } = blockParts(props, 'audio', '[--site-pad-y:18px]');
  const media = literalMedia(props.media);
  const title = literal(props.title, '');
  const caption = literal(props.caption, '');

  return (
    <div {...root}>
      <figure className="m-0 mx-auto flex w-full max-w-[68ch] flex-col gap-3 rounded-site border border-site-hairline bg-site-paper p-4">
        {title ? (
          <p {...el('title', 'm-0 font-heading text-site-md leading-tight')}>{title}</p>
        ) : null}
        <div {...el('media', 'w-full')}>
          {media ? (
            <audio className="block w-full" controls preload="metadata" loop={props.loop}>
              {audioSources(media).map((entry) => (
                <source key={entry.src} src={entry.src} type={entry.type} />
              ))}
            </audio>
          ) : (
            <span
              className="block rounded-site bg-site-media-fill px-3 py-4 font-mono text-[10px] tracking-[0.06em] text-site-ink/40"
              aria-hidden="true"
            >
              media / audio.mp3
            </span>
          )}
        </div>
        {caption ? (
          <figcaption {...el('caption', 'text-site-xs text-site-ink-soft')}>{caption}</figcaption>
        ) : null}
      </figure>
    </div>
  );
}
