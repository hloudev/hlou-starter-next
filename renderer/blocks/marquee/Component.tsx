/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { MarqueeProps } from './schema';

import { MEDIA_SIZES_ATTR } from '../media';
import { blockParts, fieldAttr, literal, literalMedia, MediaImg, styleVars } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const SPEED: Record<MarqueeProps['speed'], string> = { slow: '50s', base: '30s', fast: '16s' };

const SIZE: Record<MarqueeProps['size'], { text: string; media: string; gap: string }> = {
  sm: { text: 'text-site-md', media: 'h-8', gap: 'gap-8 px-4' },
  md: { text: 'font-heading text-site-lg', media: 'h-12', gap: 'gap-12 px-6' },
  lg: { text: 'font-heading text-site-xl', media: 'h-16', gap: 'gap-16 px-8' },
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function MarqueeBlock(props: BlockProps<MarqueeProps>): ReactElement {
  const { root, context, item } = blockParts(props, 'marquee', 'px-0');
  const size = SIZE[props.size] ?? SIZE.md;

  const track = (hidden: boolean) =>
    props.items.map((entry, index) => {
      const media = literalMedia(entry.media);
      const text = literal(entry.text, '');
      const box = item('items', index, entry, cx('flex items-center', size.gap), 'items');
      return (
        <span
          key={`${hidden ? 'b' : 'a'}-${index}`}
          className={box.className}
          style={box.style}
          data-hl-field={hidden ? undefined : box['data-hl-field']}
        >
          {media ? (
            <MediaImg
              className={cx(size.media, 'w-auto object-contain')}
              media={media}
              alt={media.alt ?? text}
              sizes={MEDIA_SIZES_ATTR.logo}
            />
          ) : (
            <span className={cx('whitespace-nowrap', size.text)}>{text}</span>
          )}
          {props.separator ? (
            <span className="text-site-accent" aria-hidden="true">
              {props.separator}
            </span>
          ) : null}
        </span>
      );
    });

  return (
    <section {...root}>
      <div
        className={cx(
          'hl-marquee w-full',
          props.direction === 'end' && 'hl-marquee--reverse',
          props.pauseOnHover && 'hl-marquee--pause'
        )}
        style={styleVars({ '--site-marquee-duration': SPEED[props.speed] ?? SPEED.base })}
        {...fieldAttr(context, 'items')}
      >
        <div className="hl-marquee__track">
          {track(false)}
          <span aria-hidden="true" className="contents">
            {track(true)}
          </span>
        </div>
      </div>
    </section>
  );
}
