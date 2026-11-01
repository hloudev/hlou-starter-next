/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { MediaTextProps } from './schema';
import { mediaTextDefaults } from './defaults';

import { renderRichText } from '../../richtext';
import { MEDIA_SIZES_ATTR } from '../media';
import {
  blockParts,
  EYEBROW_CLASSES,
  FloatingLayer,
  isLeadBlock,
  literal,
  literalMedia,
  MediaFigure,
  SiteButton,
} from '../shared';
import { aspectClasses, cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/* Media first in the DOM; `end` swaps the columns from the tablet up. */
const SPLIT: Record<MediaTextProps['split'], string> = {
  '1-1': 'md:grid-cols-2',
  '1-2': 'md:grid-cols-[1fr_2fr]',
  '2-1': 'md:grid-cols-[2fr_1fr]',
};

const ALIGN: Record<MediaTextProps['verticalAlign'], string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function MediaTextBlock(props: BlockProps<MediaTextProps>): ReactElement {
  const { root, el, item, context } = blockParts(props, 'mediaText');
  const media = literalMedia(props.media);
  const eyebrow = literal(props.eyebrow, '');
  const title = literal(props.title, '');
  const text = literal(props.text, null);
  const ratio = aspectClasses(props.mediaRatio);
  const figure = el(
    'media',
    (ratio.length > 0 ? ratio : aspectClasses(mediaTextDefaults.mediaRatio)).join(' ')
  );
  const mediaEnd = props.mediaSide === 'end';

  return (
    <section {...root}>
      <div
        className={cx(
          'relative mx-auto grid w-full max-w-site-content gap-8 md:gap-12',
          SPLIT[props.split] ?? SPLIT['1-1'],
          ALIGN[props.verticalAlign] ?? ALIGN.center
        )}
      >
        <MediaFigure
          className={cx(figure.className, mediaEnd && 'md:order-2')}
          style={figure.style}
          media={media}
          placeholder="media / image.jpg"
          sizes={MEDIA_SIZES_ATTR.half}
          priority={isLeadBlock(context, props.id)}
          field={{ 'data-hl-field': figure['data-hl-field'] }}
        />
        <div className={cx(mediaEnd && 'md:order-1')}>
          {eyebrow ? <p {...el('eyebrow', EYEBROW_CLASSES)}>{eyebrow}</p> : null}
          {title ? (
            <h2
              {...el(
                'title',
                'mb-4 font-heading text-site-lg leading-tight tracking-tight text-pretty rtl:tracking-normal'
              )}
            >
              {title}
            </h2>
          ) : null}
          {text ? (
            <div {...el('text', 'hl-rich mb-6 text-site-sm leading-relaxed text-site-ink-soft')}>
              {renderRichText(text)}
            </div>
          ) : null}
          {props.buttons.length > 0 ? (
            <div {...el('buttons', 'flex flex-wrap gap-2.5')}>
              {props.buttons.map((button, index) => {
                const { 'data-hl-field': field, ...own } = item('buttons', index, button);
                return (
                  <SiteButton
                    key={`${button.href}-${index}`}
                    label={literal(button.label, '')}
                    href={button.href}
                    variant={button.variant}
                    className={own.className || undefined}
                    style={own.style}
                    field={field ? { 'data-hl-field': field } : undefined}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
        <FloatingLayer slot={props.floating} />
      </div>
    </section>
  );
}
