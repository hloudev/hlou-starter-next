/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { AlignValue } from '../style-props';
import type { BlockProps } from '../types';
import type { FeatureGridProps } from './schema';
import { featureGridDefaults } from './defaults';

import {
  blockParts,
  cssNumber,
  fieldAttr,
  FloatingLayer,
  Icon,
  literal,
  literalMedia,
  resolveColorValue,
  styleVars,
} from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/*
 * Plain Tailwind. The column count and each card's colours are
 * props, so they stay variables (`--site-feature-cols`, `--site-blk-*`) read
 * by fixed utilities — an unset one falls back to the theme's own token.
 */
const TITLE_ALIGN: Record<AlignValue, string> = {
  start: '',
  center: 'text-center',
  end: 'text-end',
};

const CARD_BORDER = {
  bordered: 'border border-site-hairline-strong',
  plain: '',
} as const;

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function FeatureGridBlock(props: BlockProps<FeatureGridProps>): ReactElement {
  const { root, context, el, item } = blockParts(props, 'featureGrid');
  const title = literal(props.title, featureGridDefaults.title as string);
  const gridStyle = styleVars({ '--site-feature-cols': cssNumber(props.columns, 3) });
  /* Absent (not merely `'start'`) on a composition stored before this prop
     existed — `resolveDoc` never fills in a block's defaults. */
  const titleAlign = (props.titleAlign && TITLE_ALIGN[props.titleAlign]) || '';
  const cardBorder = props.bordered ? CARD_BORDER.bordered : CARD_BORDER.plain;

  return (
    <section {...root}>
      <div className="relative mx-auto w-full max-w-site-content">
        {title ? <h2 {...el('title', cx('mb-5.5 text-site-lg', titleAlign))}>{title}</h2> : null}
        <div
          className="grid grid-cols-1 gap-3.5 md:grid-cols-[repeat(var(--site-feature-cols,3),minmax(0,1fr))]"
          style={gridStyle}
          {...fieldAttr(context, 'cards')}
        >
          {props.cards.map((card, index) => {
            const iconColor = card.iconColor
              ? resolveColorValue(card.iconColor, '--site-accent')
              : undefined;
            const cardVars = styleVars({
              '--site-blk-icon-color': iconColor,
              '--site-blk-icon-bg': iconColor
                ? `color-mix(in srgb, ${iconColor} 15%, transparent)`
                : undefined,
              '--site-blk-card-bg': card.cardBackground
                ? resolveColorValue(card.cardBackground, '--site-card')
                : undefined,
            });
            const cardBox = item(
              'cards',
              index,
              card,
              cx('rounded-site bg-[var(--site-blk-card-bg,var(--site-card))] p-4.5', cardBorder),
              'cards'
            );
            return (
              <article
                key={`${card.title}-${index}`}
                className={cardBox.className}
                style={{ ...cardVars, ...cardBox.style }}
                data-hl-field={cardBox['data-hl-field']}
              >
                {card.icon || literalMedia(card.iconMedia) ? (
                  <span
                    className="mb-3 grid size-8 place-items-center rounded-md bg-[var(--site-blk-icon-bg,var(--site-accent-soft))] text-site-sm text-[color:var(--site-blk-icon-color,var(--site-accent))]"
                    aria-hidden="true"
                  >
                    <Icon
                      icon={
                        literalMedia(card.iconMedia)
                          ? { media: literalMedia(card.iconMedia) }
                          : card.icon
                      }
                      className="size-4.5"
                    />
                  </span>
                ) : null}
                <h3 className="mb-1.5 font-[inherit] text-site-sm">{literal(card.title, '')}</h3>
                <p className="text-site-sm leading-[1.55] text-site-ink-soft">
                  {literal(card.description, '')}
                </p>
              </article>
            );
          })}
        </div>
        {/* Over the content box, not the full-bleed section. */}
        <FloatingLayer slot={props.floating} />
      </div>
    </section>
  );
}
