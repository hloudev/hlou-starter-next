/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { ChoiceCardsClientProps, ChoiceOption } from './ChoiceCardsClient';
import type { ChoiceCardsProps } from './schema';

import { Island } from '../../render/island';
import { stateMessages } from '../../site/messages';
import { blockParts, literal, readIcon } from '../shared';
import { cx, GRID_COLUMN_CLASSES, responsiveLiteralClasses } from '../tw';
import {
  iconPaths,
  recordPresentation,
  recordsById,
  widgetField,
  widgetImage,
  widgetPrice,
  widgetScope,
  widgetStyled,
  WidgetUnbound,
} from '../widget-shell';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/* The design's values (« Hlou Interactif », board 4.8). The selected look —
   ring, fill, filled radio — is `:has(:checked)` in `site.css` (`.hl-choice`),
   so a page without script shows it too. */
const LEGEND = 'mb-2 p-0 text-site-xs font-medium tracking-[0.08em] text-site-ink-soft uppercase';

const GRID: Record<ChoiceCardsProps['look'], string> = {
  cards: 'grid gap-4 max-md:grid-cols-1! max-md:gap-2.5',
  segmented:
    'hl-choices__track grid auto-cols-[minmax(0,1fr)] grid-flow-col gap-1 overflow-x-auto rounded-[calc(var(--site-radius)+4px)] border border-site-hairline bg-site-well p-1 [scrollbar-width:none] max-md:auto-cols-[minmax(max-content,1fr)]',
  list: 'grid',
};

const OPTION: Record<ChoiceCardsProps['look'], string> = {
  cards:
    'hl-choice hl-choice--card group relative grid cursor-pointer content-start gap-1.5 rounded-site border border-site-hairline-strong bg-site-card px-[1.125rem] py-4 hover:border-[color-mix(in_srgb,var(--site-accent)_55%,transparent)] has-checked:border-transparent has-checked:bg-[color-mix(in_srgb,var(--site-accent-soft)_55%,var(--site-card))] has-checked:shadow-[inset_0_0_0_2px_var(--site-accent)] has-focus-visible:[outline:var(--site-focus)] has-focus-visible:outline-offset-[3px] group-aria-invalid/choices:border-site-error md:px-6 md:py-[1.375rem]',
  segmented:
    'hl-choice hl-choice--segment grid min-h-11 cursor-pointer place-items-center rounded-site px-3.5 py-1.5 text-center text-site-sm whitespace-nowrap text-site-ink-soft has-checked:bg-site-accent has-checked:text-site-on-accent has-focus-visible:[outline:var(--site-focus)] has-focus-visible:outline-offset-2',
  list: 'hl-choice hl-choice--row group flex cursor-pointer items-center gap-3 border-b border-site-hairline py-3.5 text-site-sm last:border-b-0 has-focus-visible:[outline:var(--site-focus)] has-focus-visible:outline-offset-2',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * The choice cards' server shell: it reads the bound `choice` field
 * from the scope it sits in — its options (static, or the catalog's records
 * with their price), each joined to the block's `decor` (by value) and to
 * its own `source` (by record id) — and hands its island the options as
 * JSON. Unbound, outside a scope, or bound to another type: a « Non lié »
 * placeholder in the editor, nothing on the site.
 */
export function ChoiceCardsBlock(props: BlockProps<ChoiceCardsProps>): ReactElement {
  const { root, context, el } = blockParts(props, 'choiceCards');
  const scope = widgetScope(props);
  const path = props.bind?.path ?? '';
  const field = scope && path ? widgetField(scope, path) : undefined;
  const messages = stateMessages(context.locale);
  const look = props.look in OPTION ? props.look : 'cards';

  if (!scope || field?.type !== 'choice') {
    return (
      <div {...root}>
        {context.mode === 'static' ? null : (
          <WidgetUnbound label={messages.widget.unbound}>
            <div className={cx(GRID[look], look === 'cards' && 'grid-cols-2', 'opacity-60')}>
              {['A', 'B'].map((letter) => (
                <span key={letter} className={OPTION[look]}>
                  {literal(props.label, '') || '—'} {letter}
                </span>
              ))}
            </div>
          </WidgetUnbound>
        )}
      </div>
    );
  }

  const decor = new Map((Array.isArray(props.decor) ? props.decor : []).map((d) => [d.value, d]));
  const records = recordsById(props.source);
  const options = field.options.map((option): ChoiceOption => {
    const extra = decor.get(option.value);
    const shown = recordPresentation(
      records.get(option.value),
      props.mapping,
      '(min-width: 768px) 33vw, 100vw'
    );
    const named = readIcon(extra?.icon);
    const icon = named?.kind === 'name' ? iconPaths(named.name) : shown.icon;
    const image = widgetImage(extra?.media, '(min-width: 768px) 33vw, 100vw') ?? shown.image;
    const price = props.showPrice
      ? widgetPrice(scope, scope.def.catalog[option.value]?.price, context.locale)
      : undefined;
    const description = literal(extra?.description, '') || shown.meta;
    const badge = literal(extra?.badge, '');
    return {
      value: option.value,
      label: option.label,
      ...(price ? { price } : {}),
      ...(description ? { description } : {}),
      ...(badge ? { badge } : {}),
      ...(icon && icon.length > 0 ? { icon } : {}),
      ...(image && look === 'cards' ? { image } : {}),
    };
  });
  const raw = scope.snapshot.values[field.key];
  const columns =
    look === 'cards' ? responsiveLiteralClasses(props.columns, GRID_COLUMN_CLASSES, '2') : [];

  const island: ChoiceCardsClientProps = {
    scope: context.mode === 'canvas' ? '' : scope.id,
    path: field.key,
    name: `hl-${props.id}`,
    look,
    legend: literal(props.label, '') || field.label || '',
    required: field.required === true,
    options,
    value: typeof raw === 'string' ? raw : null,
    cls: {
      label: widgetStyled(el('label', LEGEND)),
      grid: widgetStyled({ className: cx(GRID[look], columns) }),
      options: widgetStyled(el('options', OPTION[look])),
    },
    errors: messages.errors,
    icons: { check: iconPaths('check'), warning: iconPaths('warning-circle') },
  };
  return (
    <div {...root}>
      <Island name="choiceCards" markers={context.islands} props={island} />
    </div>
  );
}
