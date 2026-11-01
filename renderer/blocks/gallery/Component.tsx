/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CSSProperties, ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { LightboxItem } from './LightboxClient';
import type { GalleryProps } from './schema';
import { galleryDefaults } from './defaults';
import { LightboxIsland, lightboxItem, LightboxLink } from './lightbox';

import { stateMessages } from '../../site/messages';
import { columnsSizes, MEDIA_SIZES_ATTR, widestCount } from '../media';
import { blockParts, fieldAttr, literal, literalMedia, MediaFigure } from '../shared';
import {
  cx,
  gapClasses,
  GRID_COLUMN_CLASSES,
  MASONRY_COLUMN_CLASSES,
  responsiveLiteralClasses,
} from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const RATIO: Record<GalleryProps['ratio'], string> = {
  auto: 'aspect-auto',
  square: 'aspect-square',
  portrait: 'aspect-4/5',
  landscape: 'aspect-[4/3]',
  wide: 'aspect-[21/9]',
};

const HOVER: Record<GalleryProps['hover'], string> = {
  none: '',
  zoom: 'overflow-hidden [&_img]:transition-transform [&_img]:duration-500 hover:[&_img]:scale-105',
  caption: 'overflow-hidden',
};

/** A justified row's height: the row grows each tile by its aspect ratio. */
const JUSTIFIED_ROW_REM = 16;

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function GalleryBlock(props: BlockProps<GalleryProps>): ReactElement {
  const { root, context, el, item } = blockParts(props, 'gallery');
  const title = literal(props.title, '');
  const layout = props.layout ?? 'grid';
  const gap = gapClasses(props.gap);
  const gaps = gap.length > 0 ? gap : gapClasses(galleryDefaults.gap);
  const hover = HOVER[props.hover] ?? HOVER.none;
  /* Unset is `link`, as before M40-09: stored galleries do not change. */
  const onClick = props.onClick === 'none' || props.onClick === 'lightbox' ? props.onClick : 'link';
  const enlarge = stateMessages(context.locale).lightbox.open;
  /* The lightbox's images: only items with media, in order. */
  const viewer: LightboxItem[] = [];

  const container = cx(
    layout === 'grid' && [
      'grid',
      ...responsiveLiteralClasses(props.columns, GRID_COLUMN_CLASSES, '2'),
      ...gaps,
    ],
    layout === 'masonry' && [
      ...responsiveLiteralClasses(props.columns, MASONRY_COLUMN_CLASSES, '2'),
      ...gaps,
    ],
    layout === 'justified' && ['flex flex-wrap', ...gaps],
    layout === 'strip' && [
      'flex snap-x snap-mandatory overflow-x-auto pb-2 [scrollbar-width:thin]',
      ...gaps,
    ]
  );

  /* A strip cell is 40 % of the row from `md`; a grid / masonry cell one column. */
  const sizes =
    layout === 'strip'
      ? '(min-width: 768px) 40vw, 72vw'
      : layout === 'justified'
        ? MEDIA_SIZES_ATTR.half
        : columnsSizes(widestCount(props.columns, 3));

  return (
    <section {...root}>
      <div className="mx-auto w-full max-w-site-content">
        {title ? <h2 {...el('title', 'mb-6 font-heading text-site-lg')}>{title}</h2> : null}
        <div className={container} {...fieldAttr(context, 'items')}>
          {props.items.map((entry, index) => {
            const media = literalMedia(entry.media);
            const caption = literal(entry.caption, '');
            const ratio = media?.width && media?.height ? media.width / media.height : 4 / 3;
            const tile = item(
              'items',
              index,
              entry,
              cx(
                'group relative m-0',
                layout === 'grid' && entry.span === '2' && 'md:col-span-2',
                layout === 'masonry' && 'mb-4 break-inside-avoid',
                layout === 'justified' && 'min-w-40 grow',
                layout === 'strip' && 'w-[72%] shrink-0 snap-start md:w-[40%]'
              ),
              'items'
            );
            const justified: CSSProperties | undefined =
              layout === 'justified'
                ? { flexGrow: ratio, flexBasis: `${ratio * JUSTIFIED_ROW_REM}rem` }
                : undefined;
            const figure = (
              <>
                <MediaFigure
                  media={media}
                  sizes={sizes}
                  placeholder="media / photo.jpg"
                  className={cx(
                    hover,
                    layout === 'grid' && (RATIO[props.ratio] ?? RATIO.square),
                    layout === 'justified' && 'h-64 [&_img]:h-full',
                    layout === 'strip' && 'aspect-[4/3]',
                    layout === 'masonry' && 'aspect-auto [&_img]:h-auto'
                  )}
                />
                {caption ? (
                  props.hover === 'caption' ? (
                    <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-site-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {caption}
                    </figcaption>
                  ) : (
                    <figcaption className="mt-2 text-site-xs text-site-ink-soft">
                      {caption}
                    </figcaption>
                  )
                ) : null}
              </>
            );
            return (
              <figure
                key={`${caption}-${index}`}
                className={tile.className}
                style={{ ...justified, ...tile.style }}
                data-hl-field={tile['data-hl-field']}
              >
                {onClick === 'lightbox' && media ? (
                  <LightboxLink
                    media={media}
                    index={viewer.push(lightboxItem(media, caption)) - 1}
                    label={enlarge}
                  >
                    {figure}
                  </LightboxLink>
                ) : onClick === 'link' && entry.href ? (
                  <a href={entry.href} className="block no-underline">
                    {figure}
                  </a>
                ) : (
                  figure
                )}
              </figure>
            );
          })}
        </div>
      </div>
      {viewer.length > 0 ? <LightboxIsland items={viewer} context={context} /> : null}
    </section>
  );
}
