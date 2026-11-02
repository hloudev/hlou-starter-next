'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react';

import type { KeyboardEvent, ReactElement } from 'react';
import type { DateRange } from './dates';
import type { PluralForms } from './locale';
import {
  addDays,
  addMonths,
  isDisabled,
  monthMatrix,
  monthStart,
  nightsBetween,
  todayLocal,
  weekStartOf,
} from './dates';
import { formatDay, pluralText, weekdayNames } from './locale';
import { rangeOf } from './texts';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** The calendar's chrome copy (`StateMessages.date`), worded on the server. */
export type CalendarLabels = {
  prevMonth: string;
  nextMonth: string;
  clear: string;
  done: string;
  unavailable: string;
  pickDeparture: string;
  /** `{n}` the minimum, shown while the departure is picked. */
  minNights: string;
  nights: PluralForms;
};

export type CalendarValue = string | DateRange | null;

export type CalendarProps = {
  mode: 'single' | 'range';
  value: CalendarValue;
  /** `YYYY-MM-DD`, or `today`: the visitor's date, read when the calendar opens. */
  min?: string;
  minNights?: number;
  maxNights?: number;
  disabled?: readonly string[];
  months: 1 | 2;
  /** 1 Monday … 7 Sunday, computed on the server (`firstDayOfWeek`). */
  firstDay: number;
  locale: string;
  dir: 'ltr' | 'rtl';
  labels: CalendarLabels;
  onChange: (value: CalendarValue) => void;
  /** Esc, « Valider », and a complete pick. */
  onClose: () => void;
  /** Tests: today's `YYYY-MM-DD`. */
  today?: string;
};

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * The calendar grid, hand-built after the APG date
 * picker dialog: one or two months, a `grid` of day buttons with a roving
 * tabindex, the month heading live. Controlled — no scope import, so the
 * form (F3) uses it too. Drawn only while open, in the browser: the server
 * and the client never disagree on `Intl`'s month names.
 *
 * Range: the first pick is the arrival (the departure cleared), a pick after
 * it the departure, a pick on or before it restarts. While the departure is
 * picked, the days that break `minNights` / `maxNights` are disabled and the
 * span to the hovered (or focused) day is tinted.
 */
export function Calendar(props: CalendarProps): ReactElement {
  const { mode, value, locale, labels, firstDay, months } = props;
  const [today] = useState(() => props.today ?? todayLocal());
  const min = props.min === 'today' ? today : props.min;
  const range = mode === 'range' ? rangeOf(value) : null;
  const single = mode === 'single' && typeof value === 'string' ? value : null;
  /* The arrival, while the departure is picked. */
  const from = range && !range.to ? range.from : null;
  const rules = { ...props, min, from };
  const off = (day: string) => isDisabled(day, rules);

  const [focus, setFocus] = useState(() => {
    const held = single ?? range?.to ?? range?.from;
    if (held) return held;
    let day = min && min > today ? min : today;
    for (let n = 0; n < 366 && off(day); n++) day = addDays(day, 1);
    return day;
  });
  const [view, setView] = useState(() => monthStart(focus));
  const [hover, setHover] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  /* Focus follows `focus` on open and after a key, never after a click on an arrow. */
  const follow = useRef(true);

  useEffect(() => {
    if (!follow.current) return;
    follow.current = false;
    root.current?.querySelector<HTMLElement>(`[data-day="${focus}"]`)?.focus();
  }, [focus]);

  const last = addMonths(view, months - 1);
  const move = (day: string, keys = false) => {
    follow.current = keys;
    setFocus(day);
    if (day < view) setView(monthStart(day));
    else if (monthStart(day) > last) setView(addMonths(monthStart(day), 1 - months));
  };

  const pick = (day: string) => {
    if (off(day)) return;
    if (mode === 'single') {
      props.onChange(day);
      props.onClose();
    } else if (from && day > from) {
      props.onChange({ from, to: day });
      props.onClose();
    } else {
      props.onChange({ from: day, to: null });
    }
  };

  /* Days for the arrows (← / → swapped in RTL), months for the page keys (a year with Shift). */
  const onKeyDown = (event: KeyboardEvent) => {
    const { key } = event;
    const ahead = props.dir === 'rtl' ? -1 : 1;
    const days = { ArrowLeft: -ahead, ArrowRight: ahead, ArrowUp: -7, ArrowDown: 7 }[key];
    const page = { PageUp: -1, PageDown: 1 }[key];
    const week = weekStartOf(focus, firstDay);
    if (key === 'Escape') {
      event.preventDefault();
      props.onClose();
      return;
    }
    const next =
      days !== undefined
        ? addDays(focus, days)
        : page !== undefined
          ? addMonths(focus, page * (event.shiftKey ? 12 : 1))
          : key === 'Home'
            ? week
            : key === 'End'
              ? addDays(week, 6)
              : null;
    if (!next || !(event.target as HTMLElement).dataset.day) return;
    event.preventDefault();
    move(next, true);
  };

  /* The departure being picked: the span to the hovered (or focused) day. */
  const tip = from ? (hover ?? focus) : '';
  const end = range?.to ?? (from && tip > from && !off(tip) ? tip : null);
  const start = single ?? range?.from ?? null;
  const kind = (day: string) =>
    day === start
      ? 's'
      : day === end
        ? range?.to
          ? 'e'
          : 'h'
        : start && end && day > start && day < end
          ? range?.to
            ? 'r'
            : 't'
          : undefined;

  const names = weekdayNames(locale, firstDay);
  const nights = range?.to ? nightsBetween(range.from, range.to) : 0;
  const foot = from
    ? [
        labels.pickDeparture,
        (props.minNights ?? 0) > 1 ? labels.minNights.replace('{n}', String(props.minNights)) : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : nights
      ? pluralText(nights, labels.nights, locale)
      : '';

  const arrow = (delta: number, label: string, disabled = false) => (
    <button
      type="button"
      className="hl-cal__arrow"
      aria-label={label}
      disabled={disabled}
      onClick={() => move(addMonths(focus, delta))}
    />
  );

  return (
    <div className="hl-cal" ref={root} onKeyDown={onKeyDown}>
      <div className="hl-cal__nav">
        {arrow(-1, labels.prevMonth, min !== undefined && view <= min)}
        {arrow(1, labels.nextMonth)}
      </div>
      <div className="hl-cal__months" onMouseLeave={() => setHover(null)}>
        {Array.from({ length: months }, (_, index) => {
          const month = addMonths(view, index);
          const title = `${month}-title`;
          return (
            <div key={month} className="hl-cal__month">
              <p className="hl-cal__title" id={title} aria-live="polite">
                {formatDay(month, locale, { month: 'long', year: 'numeric' })}
              </p>
              <table role="grid" className="hl-cal__grid" aria-labelledby={title}>
                <thead>
                  <tr>
                    {names.map(([narrow, long]) => (
                      <th key={long} scope="col" abbr={long}>
                        {narrow}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthMatrix(month, firstDay)
                    .filter((week) => week.some((day) => monthStart(day) === month))
                    .map((week) => (
                      <tr key={week[0]}>
                        {week.map((day) => {
                          if (monthStart(day) !== month) return <td key={day} />;
                          const disabled = off(day);
                          const k = kind(day);
                          return (
                            <td key={day} aria-selected={k === 's' || k === 'e'}>
                              <button
                                type="button"
                                className="hl-cal__day"
                                data-day={day}
                                data-k={k}
                                tabIndex={day === focus ? 0 : -1}
                                aria-label={formatDay(day, locale, { dateStyle: 'full' })}
                                aria-disabled={disabled || undefined}
                                aria-current={day === today ? 'date' : undefined}
                                title={disabled ? labels.unavailable : undefined}
                                onClick={() => {
                                  move(day);
                                  pick(day);
                                }}
                                onMouseEnter={() => setHover(day)}
                              >
                                {formatDay(day, locale, { day: 'numeric' })}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      <div className="hl-cal__foot">
        <span className="hl-cal__note">{foot}</span>
        <button type="button" className="hl-cal__btn" onClick={() => props.onChange(null)}>
          {labels.clear}
        </button>
        <button type="button" className="hl-cal__btn hl-cal__btn--done" onClick={props.onClose}>
          {labels.done}
        </button>
      </div>
    </div>
  );
}
