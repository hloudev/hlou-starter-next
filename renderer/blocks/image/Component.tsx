/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { ImageProps } from './schema';

import { MEDIA_SIZES_ATTR } from '../media';
import { blockParts, isLeadBlock, literal, literalMedia, MediaFigure } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const RATIO: Record<ImageProps['ratio'], string> = {
  auto: 'aspect-auto min-h-24',
  square: 'aspect-square',
  landscape: 'aspect-[4/3]',
  portrait: 'aspect-4/5',
  wide: 'aspect-[21/9]',
};

/* The figure sits at the start of its row; `wide` gives up its cap nested
   in a layout block, whose container already has one. */
/** `object-position` on the figure's `<img>`, per anchor. */
const POSITION: Record<string, string> = {
  center: '',
  top: '[&_img]:object-top',
  bottom: '[&_img]:object-bottom',
  start: '[&_img]:object-left',
  end: '[&_img]:object-right',
  'top-start': '[&_img]:object-left-top',
  'top-end': '[&_img]:object-right-top',
  'bottom-start': '[&_img]:object-left-bottom',
  'bottom-end': '[&_img]:object-right-bottom',
};

/** How wide the browser should expect it, per `width` (`MEDIA_SIZES_ATTR`). */
const SIZES: Record<ImageProps['width'], string> = {
  narrow: MEDIA_SIZES_ATTR.narrow,
  wide: MEDIA_SIZES_ATTR.content,
  full: MEDIA_SIZES_ATTR.full,
};

const WIDTH: Record<ImageProps['width'], string> = {
  narrow: 'max-w-[68ch]',
  wide: 'max-w-site-content in-[.hl-slot]:max-w-none',
  full: 'max-w-none',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function ImageBlock(props: BlockProps<ImageProps>): ReactElement {
  /* A primitive on its own row breathes less than a composed section. */
  const { root, el, context } = blockParts(props, 'image', '[--site-pad-y:18px]');
  const resolved = literalMedia(props.media);
  /* The block's own alt wins; empty keeps the asset's. */
  const alt = literal(props.alt, '');
  const media = resolved && alt ? { ...resolved, alt } : resolved;
  const caption = literal(props.caption, '');
  const figure = el(
    'media',
    cx(
      RATIO[props.ratio] ?? RATIO.landscape,
      props.fit === 'contain' && '[&_img]:object-contain',
      (props.position && POSITION[props.position]) || '',
      !props.rounded && 'rounded-none'
    )
  );

  return (
    <div {...root}>
      <figure className={cx('m-0 w-full', WIDTH[props.width] ?? WIDTH.wide)}>
        <MediaFigure
          className={figure.className}
          style={figure.style}
          media={media}
          placeholder="media / image.jpg"
          sizes={SIZES[props.width] ?? SIZES.wide}
          priority={isLeadBlock(context, props.id)}
          field={{ 'data-hl-field': figure['data-hl-field'] }}
        />
        {caption ? (
          <figcaption {...el('caption', 'mt-2 text-site-xs text-site-ink-soft')}>
            {caption}
          </figcaption>
        ) : null}
      </figure>
    </div>
  );
}
