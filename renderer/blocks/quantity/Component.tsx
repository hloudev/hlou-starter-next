/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { DocScopeEnv } from '../../doc/render';
import type { BlockProps } from '../types';
import type { QuantityClientProps, QuantityRow } from './QuantityClient';
import type { QuantityProps } from './schema';

import { Island } from '../../render/island';
import { stateMessages } from '../../site/messages';
import { quantityMax } from '../../state/initial';
import { QUANTITY_MAX } from '../../state/values';
import { readIn } from '../../state/when';
import { blockParts, literal } from '../shared';
import { cx } from '../tw';
import {
  iconPaths,
  recordPresentation,
  recordsById,
  widgetField,
  widgetPrice,
  widgetScope,
  widgetStyled,
  WidgetUnbound,
} from '../widget-shell';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/* The design's values (« Hlou Interactif », board 4.7): a 132 × 44 control of
   three 44 cells on `site-well`; a row's label 500 and its hint `site-xs`;
   the extras list's card rows 16 / 20 on `site-card`. The tint of a row
   above zero and the narrow-width reflow live in `site.css` (`.hl-qty`). */
const ROW = 'hl-qty__row flex items-center gap-4 py-3.5';
const CARD_ROW =
  'hl-qty__row hl-qty__row--card flex flex-wrap items-center gap-x-[1.125rem] gap-y-2.5 rounded-site border border-site-hairline-strong bg-site-card px-3.5 py-3.5 data-on:border-[color-mix(in_srgb,var(--site-accent)_45%,transparent)] data-on:bg-[color-mix(in_srgb,var(--site-accent-soft)_60%,var(--site-card))] md:flex-nowrap md:px-5 md:py-4';
const CONTROL =
  'hl-qty__control inline-grid h-11 shrink-0 grid-cols-[2.75rem_3rem_2.75rem] rounded-site border border-site-hairline-strong bg-site-well';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * The steppers the bound field calls for: a `number` → one (its min / max /
 * increment); a `quantities` field with `key` → that record's; without key
 * → one per catalog record. `null` when the path names nothing it can step.
 */
function rowsOf(
  props: QuantityProps,
  scope: DocScopeEnv,
  locale: string
): { rows: QuantityRow[]; list: boolean } | null {
  const path = props.bind?.path ?? '';
  const field = path ? widgetField(scope, path) : undefined;
  const label = literal(props.label, '');
  const hint = literal(props.hint, '') || undefined;
  const values = scope.snapshot.values;

  if (field?.type === 'number') {
    const min = field.min ?? 0;
    const raw = values[field.key];
    return {
      list: false,
      rows: [
        {
          label: label || field.label || field.key,
          ...(hint ? { hint } : {}),
          min,
          max: field.max ?? QUANTITY_MAX,
          step: field.increment ?? 1,
          value: typeof raw === 'number' ? raw : min,
        },
      ],
    };
  }

  if (field?.type !== 'quantities') return null;
  const records = recordsById(props.source);
  const key = props.bind?.key || (path.includes('.') ? path.slice(path.indexOf('.') + 1) : '');
  const ids = key ? field.items.filter((id) => id === key) : field.items;
  if (key && ids.length === 0) return null;
  const rows = ids.map((id): QuantityRow => {
    const entry = scope.def.catalog[id];
    const price = props.showPrice ? widgetPrice(scope, entry?.price, locale) : undefined;
    const shown = recordPresentation(records.get(id), props.mapping, '42px');
    const qty = readIn(values, `${field.key}.${id}`);
    return {
      key: id,
      label: (key && label) || entry?.title || id,
      ...((key ? hint : shown.meta) ? { hint: key ? hint : shown.meta } : {}),
      ...(price ? { price } : {}),
      ...(!key && shown.icon ? { icon: shown.icon } : {}),
      ...(!key && !shown.icon && shown.image ? { image: shown.image } : {}),
      min: 0,
      max: quantityMax(field),
      step: 1,
      value: typeof qty === 'number' ? qty : 0,
    };
  });
  return { rows, list: !key };
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * The quantity block's server shell (M40-13): it reads the bound field from
 * the scope it sits in (`__hl.scope`) and hands its island the rows, bounds,
 * prices and copy as JSON; the island draws them — on the server too, so the
 * published page shows the steppers before any script. Unbound, outside a
 * scope, or bound to a path it cannot step: a « Non lié » placeholder in the
 * editor, nothing on the site.
 */
export function QuantityBlock(props: BlockProps<QuantityProps>): ReactElement {
  const { root, context, el } = blockParts(props, 'quantity');
  const scope = widgetScope(props);
  const shaped = scope ? rowsOf(props, scope, context.locale) : null;
  const messages = stateMessages(context.locale);

  if (!scope || !shaped || shaped.rows.length === 0) {
    return (
      <div {...root}>
        {context.mode === 'static' ? null : (
          <WidgetUnbound label={messages.widget.unbound}>
            <div className={cx(ROW, 'opacity-60')}>
              <span className="flex-1 font-medium">{literal(props.label, '') || '—'}</span>
              <span className={cx(CONTROL, 'place-items-center text-site-sm')}>
                <span>−</span>
                <span>0</span>
                <span>+</span>
              </span>
            </div>
          </WidgetUnbound>
        )}
      </div>
    );
  }

  const unit = literal(props.unitLabel, '');
  const island: QuantityClientProps = {
    scope: context.mode === 'canvas' ? '' : scope.id,
    path: (props.bind?.path ?? '').split('.')[0] ?? '',
    uid: props.id,
    list: shaped.list,
    rows: shaped.rows,
    ...(unit && shaped.rows.some((row) => row.price) ? { unit } : {}),
    cls: {
      rows: widgetStyled(el('rows', shaped.list ? CARD_ROW : ROW)),
      label: widgetStyled(el('label', 'font-medium')),
      hint: widgetStyled(el('hint', 'text-site-xs text-site-ink-soft')),
      control: widgetStyled(el('control', cx(CONTROL, shaped.list && 'max-md:order-4'))),
      price: widgetStyled(
        el(
          'price',
          cx(
            'hl-qty__price grid text-end text-site-sm',
            shaped.list && 'max-md:order-3 max-md:flex-1 max-md:text-start'
          )
        )
      ),
    },
    dec: messages.quantity.dec,
    inc: messages.quantity.inc,
    errors: messages.errors,
    icons: {
      minus: iconPaths('minus'),
      plus: iconPaths('plus'),
      warning: iconPaths('warning-circle'),
    },
  };
  return (
    <div {...root}>
      <Island name="quantity" markers={context.islands} props={island} />
    </div>
  );
}
