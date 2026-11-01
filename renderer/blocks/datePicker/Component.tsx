/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { DocScopeEnv } from '../../doc/render';
import type { ScopeDefField } from '../../state/schema';
import type { CalendarValue } from '../../widgets/calendar';
import type { BlockProps } from '../types';
import type { DatePickerClientProps } from './DatePickerClient';
import type { DatePickerProps } from './schema';

import { Island } from '../../render/island';
import { stateMessages } from '../../site/messages';
import { isIsoDay } from '../../widgets/calendar/dates';
import { firstDayOfWeek } from '../../widgets/calendar/locale';
import { dateFieldTexts } from '../../widgets/calendar/texts';
import { blockParts, literal } from '../shared';
import { widgetScope, WidgetUnbound } from '../widget-shell';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

type DateDefField = Extract<ScopeDefField, { type: 'date' | 'dateRange' }>;

/** The bound field: a `date` or `dateRange` of the scope, by key. */
function boundField(scope: DocScopeEnv | null, path: string): DateDefField | null {
  const field = scope?.def.fields.find((entry) => entry.key === path);
  return field && (field.type === 'date' || field.type === 'dateRange') ? field : null;
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * The date picker's server shell (M40-12): the block root (its `when` and
 * scheme), and the island drawing the field — one trigger, or two for a
 * split range — from the scope's def and render-time snapshot, so the first
 * paint already shows the stored bounds and value. The island binds it to
 * the live store. In the canvas the field draws inert (no marker, no
 * script). Unbound — no scope, a path the scope lacks, a field of another
 * type — the editor frames the inert field « Non lié » (`WidgetUnbound`, as
 * the other widgets) and the published site draws nothing.
 */
export function DatePickerBlock(props: BlockProps<DatePickerProps>): ReactElement {
  const { root, context, el } = blockParts(props, 'datePicker');
  const canvas = context.mode === 'canvas';
  const messages = stateMessages(context.locale);
  const scope = widgetScope(props);
  const field = boundField(scope, (props.bind?.path ?? '').trim());
  const mode = field?.type === 'dateRange' ? 'range' : 'single';
  const look = mode === 'range' && props.look === 'split' ? 'split' : 'field';
  const value = (field ? (scope?.snapshot.values[field.key] ?? null) : null) as CalendarValue;
  const live = field !== null && !canvas;
  const labels = { ...messages.date, close: messages.close, nights: messages.nights };

  const island: DatePickerClientProps = {
    id: `${props.id}-date`,
    scope: scope?.id ?? '',
    path: field?.key ?? '',
    mode,
    look,
    value,
    texts: dateFieldTexts({
      mode,
      value,
      look,
      locale: context.locale,
      dir: context.dir,
      nights: messages.nights,
    }),
    ...(field?.min ? { min: field.min } : {}),
    ...(field?.type === 'dateRange' && field.minNights !== undefined
      ? { minNights: field.minNights }
      : {}),
    ...(field?.type === 'dateRange' && field.maxNights !== undefined
      ? { maxNights: field.maxNights }
      : {}),
    disabled: (Array.isArray(props.disabledDates) ? props.disabledDates : []).filter(isIsoDay),
    months: props.months === 'one' || props.months === 'two' ? props.months : 'auto',
    firstDay: firstDayOfWeek(context.locale, props.weekStart),
    locale: context.locale,
    dir: context.dir,
    label: literal(props.label, ''),
    fromLabel: literal(props.fromLabel, '') || messages.date.arrival,
    toLabel: literal(props.toLabel, '') || messages.date.departure,
    labels,
    errors: messages.errors,
    error: field ? (scope?.snapshot.errors[field.key] ?? null) : null,
    inert: !live,
    elements: { label: el('label'), field: el('field'), calendar: el('calendar') },
  };

  const picker = <Island name="datePicker" markers={live && context.islands} props={island} />;
  return (
    <div {...root}>
      <div className="mx-auto w-full max-w-site-content in-[.hl-slot]:max-w-none">
        {field ? (
          picker
        ) : context.mode === 'static' ? null : (
          <WidgetUnbound label={messages.widget.unbound}>{picker}</WidgetUnbound>
        )}
      </div>
    </div>
  );
}
