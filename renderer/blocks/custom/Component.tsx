/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { CustomProps } from './schema';

import { renderRichText } from '../../richtext';
import { MEDIA_SIZES_ATTR } from '../media';
import {
  blockParts,
  EYEBROW_CLASSES,
  fieldAttr,
  FloatingLayer,
  Icon,
  itemAttr,
  literal,
  literalMedia,
  MediaFigure,
  SiteButton,
} from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * Hlou's own render of a custom section: every prop shown plainly, in
 * order, so nothing is lost while the section has no variant yet. A
 * `codeVariant` branch in an edited copy of this file is where the design
 * goes — keep the helpers (`blockParts`, `el`, `item`, `literal`) so the
 * canvas's click-to-edit and the designer's styles keep working.
 */
export function CustomBlock(props: BlockProps<CustomProps>): ReactElement {
  const { root, context, el, item } = blockParts(props, 'custom');
  const eyebrow = literal(props.eyebrow, '');
  const title = literal(props.title, '');
  const text = literal(props.text, null);

  return (
    <section {...root}>
      <div className="relative mx-auto w-full max-w-site-content">
        {eyebrow ? <p {...el('eyebrow', EYEBROW_CLASSES)}>{eyebrow}</p> : null}
        {title ? (
          <h2 {...el('title', 'mb-4 font-heading text-site-lg leading-tight')}>{title}</h2>
        ) : null}
        {text ? (
          <div
            {...el(
              'text',
              'hl-rich mb-6 max-w-[60ch] text-site-sm leading-relaxed text-site-ink-soft'
            )}
          >
            {renderRichText(text)}
          </div>
        ) : null}
        {props.items.length > 0 ? (
          <ul
            className="m-0 grid list-none gap-4 p-0 md:grid-cols-2"
            {...fieldAttr(context, 'items')}
          >
            {props.items.map((entry, index) => {
              const media = literalMedia(entry.media);
              const label = literal(entry.label, '');
              const box = item(
                'items',
                index,
                entry,
                'flex gap-4 rounded-site border border-site-hairline p-4',
                'items'
              );
              return (
                <li
                  key={`${literal(entry.title, '')}-${index}`}
                  className={box.className}
                  style={box.style}
                  data-hl-field={box['data-hl-field']}
                >
                  {media ? (
                    <MediaFigure
                      media={media}
                      className="size-16 shrink-0"
                      sizes={MEDIA_SIZES_ATTR.icon}
                    />
                  ) : entry.icon && (entry.icon.name || entry.icon.media || entry.icon.glyph) ? (
                    <span className="grid size-10 shrink-0 place-items-center rounded-site bg-site-accent-soft text-site-accent">
                      <Icon icon={entry.icon} className="size-5" />
                    </span>
                  ) : null}
                  <div>
                    <h3 className="m-0 mb-1 text-site-md">{literal(entry.title, '')}</h3>
                    <p className="m-0 text-site-sm text-site-ink-soft">{literal(entry.text, '')}</p>
                    {entry.href && label ? (
                      <a
                        className="mt-2 inline-block text-site-sm text-site-accent"
                        href={entry.href}
                      >
                        {label}
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
        {props.media.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3" {...fieldAttr(context, 'media')}>
            {props.media.map((entry, index) => {
              const media = literalMedia(entry.media);
              const caption = literal(entry.caption, '');
              return (
                <figure key={index} className="m-0" {...itemAttr(context, 'media', index)}>
                  <MediaFigure
                    media={media}
                    className="aspect-[4/3]"
                    sizes={MEDIA_SIZES_ATTR.third}
                    placeholder="media / image.jpg"
                  />
                  {caption ? (
                    <figcaption className="mt-2 text-site-xs text-site-ink-soft">
                      {caption}
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
        ) : null}
        {props.buttons.length > 0 ? (
          <div {...el('buttons', cx('mt-6 flex flex-wrap gap-2.5'))}>
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
        <FloatingLayer slot={props.floating} />
      </div>
    </section>
  );
}
