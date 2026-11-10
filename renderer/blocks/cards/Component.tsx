/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { AlignValue } from '../style-props';
import type { BlockProps } from '../types';
import type { CardsProps } from './schema';
import { cardsDefaults } from './defaults';

import { columnsSizes, widestCount } from '../media';
import {
  blockParts,
  EYEBROW_CLASSES,
  fieldAttr,
  FloatingLayer,
  Icon,
  literal,
  literalMedia,
  MediaFigure,
} from '../shared';
import { cx, GRID_COLUMN_CLASSES, responsiveLiteralClasses } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const TITLE_ALIGN: Record<AlignValue, string> = {
  start: '',
  center: 'text-center',
  end: 'text-end',
};

/** The card's box per variant; `image-bg` draws the media behind the copy. */
const VARIANT: Record<CardsProps['variant'], { card: string; copy: string }> = {
  plain: { card: '', copy: '' },
  bordered: { card: 'rounded-site border border-site-hairline-strong bg-site-card p-5', copy: '' },
  elevated: { card: 'rounded-site bg-site-card p-5 shadow-lg shadow-black/5', copy: '' },
  'image-top': { card: 'rounded-site overflow-hidden bg-site-card', copy: 'p-5' },
  'image-bg': {
    card: 'relative isolate min-h-72 overflow-hidden rounded-site bg-site-ink text-site-on-ink',
    copy: 'relative z-10 flex h-full flex-col justify-end p-5',
  },
};

const ALIGN: Record<CardsProps['align'], string> = {
  start: '',
  center: 'items-center text-center',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function CardsBlock(props: BlockProps<CardsProps>): ReactElement {
  const { root, context, el, item } = blockParts(props, 'cards');
  const title = literal(props.title, '');
  const variant = VARIANT[props.variant] ?? VARIANT.bordered;
  const align = ALIGN[props.align] ?? ALIGN.start;
  const columns = responsiveLiteralClasses(props.columns, GRID_COLUMN_CLASSES, '1');
  const titleAlign = (props.titleAlign && TITLE_ALIGN[props.titleAlign]) || '';
  const sizes = columnsSizes(widestCount(props.columns, 3));

  return (
    <section {...root}>
      <div className="relative mx-auto w-full max-w-site-content">
        {title ? (
          <h2 {...el('title', cx('mb-6 font-heading text-site-lg', titleAlign))}>{title}</h2>
        ) : null}
        <div
          className={cx(
            'grid gap-5',
            columns.length > 0
              ? columns
              : responsiveLiteralClasses(cardsDefaults.columns, GRID_COLUMN_CLASSES, '1')
          )}
          {...fieldAttr(context, 'items')}
        >
          {props.items.map((card, index) => {
            const media = literalMedia(card.media);
            const cardTitle = literal(card.title, '');
            const text = literal(card.text, '');
            const eyebrow = literal(card.eyebrow, '');
            const buttonLabel = literal(card.buttonLabel, '');
            const box = item(
              'items',
              index,
              card,
              cx(variant.card, 'flex flex-col', align),
              'items'
            );
            const content = (
              <>
                {props.variant === 'image-top' && media ? (
                  <MediaFigure
                    media={media}
                    className="aspect-[3/2] rounded-none"
                    sizes={sizes}
                    placeholder="media / card.jpg"
                  />
                ) : null}
                {props.variant === 'image-bg' && media ? (
                  <MediaFigure
                    media={media}
                    className="absolute inset-0 -z-10 rounded-none opacity-70"
                    sizes={sizes}
                  />
                ) : null}
                <div className={cx(variant.copy, 'flex flex-1 flex-col', align)}>
                  {card.icon && (card.icon.name || card.icon.media || card.icon.glyph) ? (
                    <span
                      className="mb-4 grid size-11 place-items-center rounded-site bg-site-accent-soft text-site-accent"
                      aria-hidden="true"
                    >
                      <Icon icon={card.icon} className="size-5.5" />
                    </span>
                  ) : null}
                  {eyebrow ? <p className={EYEBROW_CLASSES}>{eyebrow}</p> : null}
                  {cardTitle ? (
                    <h3 className="mb-2 font-heading text-site-md leading-tight">{cardTitle}</h3>
                  ) : null}
                  {text ? (
                    <p className="text-site-sm leading-[1.55] text-site-ink-soft">{text}</p>
                  ) : null}
                  {card.href && buttonLabel ? (
                    <a
                      className="mt-auto inline-flex items-center gap-1.5 pt-4 text-site-sm font-medium text-site-accent"
                      href={card.href}
                    >
                      {buttonLabel}
                      <Icon icon={{ name: 'arrow-right' }} className="size-4" />
                    </a>
                  ) : null}
                </div>
              </>
            );
            /* A card with a link and no link label is the link itself. */
            return card.href && !buttonLabel ? (
              <a
                key={`${cardTitle}-${index}`}
                href={card.href}
                className={cx(box.className, 'text-inherit no-underline')}
                style={box.style}
                data-hl-field={box['data-hl-field']}
                data-hl-motion={box['data-hl-motion']}
              >
                {content}
              </a>
            ) : (
              <article
                key={`${cardTitle}-${index}`}
                className={box.className}
                style={box.style}
                data-hl-field={box['data-hl-field']}
                data-hl-motion={box['data-hl-motion']}
              >
                {content}
              </article>
            );
          })}
        </div>
        <FloatingLayer slot={props.floating} />
      </div>
    </section>
  );
}
