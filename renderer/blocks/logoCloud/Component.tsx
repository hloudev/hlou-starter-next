/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { LogoCloudProps } from './schema';
import { logoCloudDefaults } from './defaults';

import { MEDIA_SIZES_ATTR } from '../media';
import { blockParts, fieldAttr, literal, literalMedia, MediaImg } from '../shared';
import { cx, GRID_COLUMN_CLASSES, responsiveLiteralClasses } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const SIZE: Record<LogoCloudProps['size'], string> = { sm: 'h-7', md: 'h-10', lg: 'h-14' };

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function LogoCloudBlock(props: BlockProps<LogoCloudProps>): ReactElement {
  const { root, context, el, item } = blockParts(props, 'logoCloud');
  const title = literal(props.title, '');
  const columns = responsiveLiteralClasses(props.columns, GRID_COLUMN_CLASSES);
  const size = SIZE[props.size] ?? SIZE.md;

  return (
    <section {...root}>
      <div className="mx-auto w-full max-w-site-content">
        {title ? (
          <p
            {...el(
              'title',
              'mb-6 text-center text-site-xs tracking-[0.14em] text-site-ink-soft uppercase'
            )}
          >
            {title}
          </p>
        ) : null}
        <ul
          className={cx(
            'm-0 grid list-none items-center gap-x-8 gap-y-6 p-0',
            columns.length > 0
              ? columns
              : responsiveLiteralClasses(logoCloudDefaults.columns, GRID_COLUMN_CLASSES, '2')
          )}
          {...fieldAttr(context, 'items')}
        >
          {props.items.map((entry, index) => {
            const media = literalMedia(entry.media);
            const alt = literal(entry.alt, '');
            const box = item(
              'items',
              index,
              entry,
              cx(
                'flex items-center justify-center',
                props.grayscale &&
                  'opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0'
              ),
              'items'
            );
            const logo = media ? (
              <MediaImg
                className={cx(size, 'w-auto max-w-full object-contain')}
                media={media}
                alt={alt || media.alt || ''}
                sizes={MEDIA_SIZES_ATTR.logo}
              />
            ) : (
              <span
                className={cx(
                  size,
                  'grid w-24 place-items-center rounded-site bg-site-well font-mono text-[10px] text-site-ink/40'
                )}
                aria-hidden="true"
              >
                logo
              </span>
            );
            return (
              <li
                key={`${alt}-${index}`}
                className={box.className}
                style={box.style}
                data-hl-field={box['data-hl-field']}
                data-hl-motion={box['data-hl-motion']}
              >
                {entry.href ? (
                  <a href={entry.href} aria-label={alt || undefined} className="inline-flex">
                    {logo}
                  </a>
                ) : (
                  logo
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
