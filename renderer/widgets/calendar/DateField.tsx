'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { createElement, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { CSSProperties, ReactElement } from 'react';
import type { CalendarLabels, CalendarProps, CalendarValue } from './Calendar';
import { Calendar } from './Calendar';
import { dateFieldTexts } from './texts';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** The field's chrome copy (`StateMessages.date`) beside the calendar's. */
export type DateFieldLabels = CalendarLabels & {
  placeholder: string;
  chooseOne: string;
  chooseRange: string;
  close: string;
};

/** A styleable element's attributes, computed by the server shell (`blockParts`). */
export type DateFieldElement = {
  className?: string;
  style?: CSSProperties;
  'data-hl-field'?: string;
};

export type DateFieldProps = Pick<
  CalendarProps,
  'mode' | 'value' | 'min' | 'minNights' | 'maxNights' | 'disabled' | 'firstDay' | 'locale' | 'dir'
> & {
  /** The ids of the field's parts start with it. */
  id: string;
  /** A range as one field (« 14 nov. → 17 nov. · 3 nuits ») or two (Arrivée / Départ). */
  look: 'field' | 'split';
  /** `auto`: one under 768 px, two from there. A bottom sheet under 640 px always shows one. */
  months: 'auto' | 'one' | 'two';
  label: string;
  fromLabel: string;
  toLabel: string;
  labels: DateFieldLabels;
  onChange: (value: CalendarValue) => void;
  /** The trigger texts, as the server formatted them: used while the value is the server's. */
  texts?: readonly [string, string] | null;
  /** A worded error: `aria-invalid`, shown under the field. */
  error?: string | null;
  /** The canvas: drawn, never opened. */
  inert?: boolean;
  /** The scope path step validation focuses (`data-hl-field-for`). */
  fieldFor?: string;
  elements?: { label?: DateFieldElement; field?: DateFieldElement; calendar?: DateFieldElement };
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** The gap between the field and the popover, and the viewport margin it keeps. */
const GAP = 10;
const EDGE = 8;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

const join = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ');

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * A date field (M40-12): a trigger drawn like an input — two side by side
 * for a split range — opening the calendar in a `popover="auto"` dialog (top
 * layer, Esc, light dismiss) placed under the field, flipped above when it
 * has no room, kept in the viewport; under 640 px a bottom sheet with one
 * month. The calendar renders only while open. Controlled and scope-free:
 * the date picker block binds it to a scope, the form (F3) to its inputs.
 */
export function DateField(props: DateFieldProps): ReactElement {
  const { id, mode, labels, look, elements = {} } = props;
  const [open, setOpen] = useState(false);
  const [months, setMonths] = useState<1 | 2>(1);
  const box = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const split = mode === 'range' && look === 'split';
  const [first, second] = props.texts ?? dateFieldTexts({ ...props, nights: labels.nights });
  const errorId = props.error ? `${id}-error` : undefined;
  const popId = `${id}-pop`;

  const close = () => {
    pop.current?.hidePopover();
    box.current?.querySelector('button')?.focus();
  };

  /* The triggers open it natively (`popovertarget`); light dismiss and Esc
     close it. The calendar renders once it is open, and the card shows once
     it is placed (`data-open`). */
  useEffect(() => {
    const panel = pop.current;
    const wide = (query: string) => matchMedia(query).matches;
    const onToggle = (event: Event) => {
      const opened = (event as ToggleEvent).newState === 'open';
      if (opened) {
        setMonths(
          (props.months === 'two' || (props.months === 'auto' && wide('(min-width: 768px)'))) &&
            wide('(min-width: 640px)')
            ? 2
            : 1
        );
      }
      setOpen(opened);
    };
    panel?.addEventListener('toggle', onToggle);
    return () => panel?.removeEventListener('toggle', onToggle);
  }, [props.months]);

  /* Under the field, flipped above without room, inside the viewport (the sheet ignores it). */
  useLayoutEffect(() => {
    const panel = pop.current;
    const field = box.current?.querySelector<HTMLElement>('.hl-dp__group');
    if (!open || !panel || !field) return;
    const anchor = field.getBoundingClientRect();
    const size = panel.getBoundingClientRect();
    let top = anchor.bottom + GAP;
    if (top + size.height > innerHeight - EDGE && anchor.top - GAP - size.height >= EDGE) {
      top = anchor.top - GAP - size.height;
    }
    const start = props.dir === 'rtl' ? anchor.right - size.width : anchor.left;
    const left = Math.max(EDGE, Math.min(start, innerWidth - size.width - EDGE));
    panel.style.setProperty('--site-dp-y', `${top}px`);
    panel.style.setProperty('--site-dp-x', `${left}px`);
  }, [open, months, props.dir]);

  const button = (text: string, labelId: string, own: string, focusable: boolean) => (
    <button
      type="button"
      id={own}
      {...elements.field}
      className={join('hl-dp__input', elements.field?.className)}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-labelledby={`${labelId} ${own}`}
      aria-invalid={props.error ? true : undefined}
      aria-describedby={errorId}
      data-hl-field-for={focusable ? props.fieldFor : undefined}
      tabIndex={props.inert ? -1 : undefined}
      popoverTarget={props.inert ? undefined : popId}
    >
      <span className={text ? undefined : 'hl-dp__ph'}>{text || labels.placeholder}</span>
      <i className="hl-dp__icon" aria-hidden="true" />
    </button>
  );

  /* A real `<label>` for the one-field trigger; the split's two name their buttons by id. */
  const label = (labelId: string, text: string, target?: string) =>
    createElement(
      target ? 'label' : 'span',
      {
        id: labelId,
        htmlFor: target,
        ...elements.label,
        className: join('hl-dp__label', elements.label?.className),
      },
      text
    );

  return (
    <div ref={box} className={join('hl-dp', props.error ? 'hl-dp--error' : undefined)}>
      {split ? (
        <fieldset className="hl-dp__set">
          <legend className="hl-dp__legend">{props.label}</legend>
          <div className="hl-dp__group hl-dp__split">
            {[props.fromLabel, props.toLabel].map((text, index) => (
              <div key={index} className="hl-dp__end">
                {label(`${id}-l${index}`, text)}
                {button(index ? second : first, `${id}-l${index}`, `${id}-b${index}`, !index)}
              </div>
            ))}
          </div>
        </fieldset>
      ) : (
        <>
          {label(`${id}-l`, props.label, `${id}-b`)}
          <div className="hl-dp__group">{button(first, `${id}-l`, `${id}-b`, true)}</div>
        </>
      )}
      {props.error ? (
        <p id={errorId} className="hl-dp__error">
          {props.error}
        </p>
      ) : null}
      {props.inert ? null : (
        <div
          ref={pop}
          id={popId}
          popover="auto"
          role="dialog"
          aria-label={mode === 'range' ? labels.chooseRange : labels.chooseOne}
          data-open={open || undefined}
          {...elements.calendar}
          className={join('hl-dp__pop', elements.calendar?.className)}
        >
          {open ? (
            <>
              <div className="hl-dp__head">
                <p>{mode === 'range' ? labels.chooseRange : labels.chooseOne}</p>
                <button
                  type="button"
                  className="hl-cal__arrow hl-cal__arrow--close"
                  aria-label={labels.close}
                  onClick={close}
                />
              </div>
              <Calendar {...props} months={months} labels={labels} onClose={close} />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
