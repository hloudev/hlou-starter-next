/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CalendarLabels, CalendarValue } from './Calendar';
import type { DateFieldProps } from './DateField';
import type { DateRange } from './dates';
import { nightsBetween } from './dates';
import { formatDay, pluralText } from './locale';

/*
 * Pure, and NOT a client module: the date picker block's server shell calls
 * `dateFieldTexts` to draw its first render. A function exported from a
 * `'use client'` file is a client reference in the Next starter's server
 * components — calling it there fails the static export.
 */

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** A range value, or `null` for a single date or nothing. */
export function rangeOf(value: CalendarValue): DateRange | null {
  return typeof value === 'object' && value !== null && value.from ? value : null;
}

/**
 * The trigger texts of a value: one field, or the two ends of a split range.
 * Single: « 14/11/2026 »; split: « sam. 14 nov. »; one field: « 14 nov. →
 * 17 nov. · 3 nuits ». Empty texts read the placeholder. Also run on the
 * server, so the first render and the hydration agree.
 */
export function dateFieldTexts(
  props: Pick<DateFieldProps, 'mode' | 'value' | 'look' | 'locale' | 'dir'> & {
    nights: CalendarLabels['nights'];
  }
): [string, string] {
  const { value, locale } = props;
  if (props.mode === 'single') {
    return [
      typeof value === 'string'
        ? formatDay(value, locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '',
      '',
    ];
  }
  const range = rangeOf(value);
  if (!range) return ['', ''];
  if (props.look === 'split') {
    const day = (iso: string | null) =>
      iso ? formatDay(iso, locale, { weekday: 'short', day: 'numeric', month: 'short' }) : '';
    return [day(range.from), day(range.to)];
  }
  const short = (iso: string) => formatDay(iso, locale, { day: 'numeric', month: 'short' });
  const arrow = props.dir === 'rtl' ? ' ← ' : ' → ';
  if (!range.to) return [`${short(range.from)}${arrow}…`, ''];
  const nights = pluralText(nightsBetween(range.from, range.to), props.nights, locale);
  return [`${short(range.from)}${arrow}${short(range.to)} · ${nights}`, ''];
}
