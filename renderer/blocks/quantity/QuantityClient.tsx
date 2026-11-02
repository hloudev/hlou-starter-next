'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react';

import type { KeyboardEvent, PointerEvent, ReactElement } from 'react';
import type { Action } from '../../state/schema';
import type { WidgetImage, WidgetStyled } from '../widget-client';

import { useScopeState } from '../../state/react';
import { useLive, useScopeError, WidgetError, WidgetIcon } from '../widget-client';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** One stepper, as the server shell shaped it from the scope's def. */
export type QuantityRow = {
  /** A record id of a `quantities` field; absent for a `number` field. */
  key?: string;
  label: string;
  hint?: string;
  /** The unit price, formatted. */
  price?: string;
  icon?: string[];
  image?: WidgetImage;
  min: number;
  max: number;
  step: number;
  /** The render-time value. */
  value: number;
};

export type QuantityClientProps = {
  /** The scope's id; `''` in the canvas (inert: no store, no events). */
  scope: string;
  /** The field key. */
  path: string;
  /** The block's id: the base of every element id. */
  uid: string;
  /** The extras list (a `quantities` field without key): card rows. */
  list: boolean;
  rows: QuantityRow[];
  /** Beside each price: « / personne ». */
  unit?: string;
  /** Each styleable element, defaults merged with the designer's styles. */
  cls: Record<'label' | 'hint' | 'control' | 'rows' | 'price', WidgetStyled>;
  /** `{label}` templates: « Retirer : {label} », « Ajouter : {label} ». */
  dec: string;
  inc: string;
  /** The scope's error copy, by code. */
  errors: Record<string, string>;
  icons: { minus: string[]; plus: string[]; warning: string[] };
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** A held button repeats after this long… */
const HOLD_MS = 400;
/** …every this long. */
const REPEAT_MS = 80;

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * One row and its stepper « − n + » (the APG spinbutton): a group, two
 * buttons and a numeric text input. ↑ / ↓ step, PageUp / PageDown ten steps,
 * Home / End the bounds, typed digits commit on Enter or blur, clamped; a
 * held button repeats. Before hydration (no script) and in the canvas it
 * draws the value, disabled. A list row is marked `data-on` above zero.
 */
function Row({
  props,
  row,
  id,
  live,
  error,
}: {
  props: QuantityClientProps;
  row: QuantityRow;
  id: string;
  live: boolean;
  error: string;
}): ReactElement {
  const { path, cls, icons } = props;
  const at = row.key ? `${path}.${row.key}` : path;
  const [raw, dispatch] = useScopeState<unknown>(props.scope, at, row.value);
  const value = typeof raw === 'number' ? raw : row.min;
  const [draft, setDraft] = useState<string | null>(null);
  const latest = useRef(value);
  latest.current = value;
  const timer = useRef(0);

  const stop = () => clearTimeout(timer.current);
  useEffect(() => stop, []);

  const send = (action: Action) => live && dispatch(action);
  /** One step (or `by`) up or down; nothing past a bound. */
  const step = (sign: 1 | -1, by?: number) => {
    const current = latest.current;
    if (sign > 0 ? current >= row.max : current <= row.min) return false;
    send({
      do: sign > 0 ? 'inc' : 'dec',
      path,
      ...(row.key ? { key: row.key } : {}),
      ...(by ? { by } : {}),
    });
    return true;
  };
  const set = (n: number) => {
    const next = Math.min(row.max, Math.max(row.min, n));
    if (next !== latest.current) send({ do: 'set', path: at, value: next });
  };
  const commit = () => {
    if (draft) set(Number.parseInt(draft, 10));
    setDraft(null);
  };

  const keys: Record<string, () => unknown> = {
    ArrowUp: () => step(1),
    ArrowDown: () => step(-1),
    PageUp: () => step(1, row.step * 10),
    PageDown: () => step(-1, row.step * 10),
    Home: () => set(row.min),
    End: () => set(row.max),
    Enter: commit,
    Escape: () => setDraft(null),
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const run = keys[event.key];
    if (!run) return;
    event.preventDefault();
    run();
  };

  /* A press steps at once, then repeats while held; a keyboard click steps once. */
  const button = (sign: 1 | -1) => (
    <button
      type="button"
      className="hl-qty__btn grid size-11 cursor-pointer touch-manipulation place-items-center rounded-site border-0 bg-transparent p-0 text-site-accent select-none hover:bg-site-accent-soft disabled:cursor-default disabled:hover:bg-transparent aria-disabled:cursor-default aria-disabled:text-site-ink-soft aria-disabled:opacity-40 aria-disabled:hover:bg-transparent"
      aria-label={(sign > 0 ? props.inc : props.dec).replace('{label}', row.label)}
      aria-disabled={(sign > 0 ? value >= row.max : value <= row.min) || undefined}
      disabled={!live}
      onPointerDown={(event: PointerEvent) => {
        if (event.button !== 0 || !step(sign)) return;
        stop();
        const repeat = () => {
          if (step(sign)) timer.current = window.setTimeout(repeat, REPEAT_MS);
        };
        timer.current = window.setTimeout(repeat, HOLD_MS);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onClick={(event) => {
        if (event.detail === 0) step(sign);
      }}
    >
      <WidgetIcon d={sign > 0 ? icons.plus : icons.minus} className="size-4" />
    </button>
  );

  const described = [row.hint && `${id}-hint`, error && `${props.uid}-error`]
    .filter(Boolean)
    .join(' ');

  return (
    <div {...cls.rows} data-on={(props.list && value > 0) || undefined}>
      {row.icon ? (
        <span className="hl-qty__icon grid size-[2.625rem] shrink-0 place-items-center rounded-site-pill border border-site-hairline-strong text-site-accent">
          <WidgetIcon d={row.icon} className="size-5" />
        </span>
      ) : row.image ? (
        <img
          {...row.image}
          className="hl-qty__icon size-[2.625rem] shrink-0 rounded-site-pill object-cover"
        />
      ) : null}
      <span
        className={`hl-qty__text grid min-w-0 flex-1 ${props.list ? 'max-md:basis-[calc(100%-3.5rem)]' : ''}`}
      >
        <span id={`${id}-label`} {...cls.label}>
          {row.label}
        </span>
        {row.hint ? (
          <span id={`${id}-hint`} {...cls.hint}>
            {row.hint}
          </span>
        ) : null}
      </span>
      {row.price ? (
        <span {...cls.price}>
          <span className="text-site-accent tabular-nums">{row.price}</span>
          {props.unit ? (
            <span className="text-site-xs text-site-ink-soft">{props.unit}</span>
          ) : null}
        </span>
      ) : null}
      <div role="group" aria-labelledby={`${id}-label`} {...cls.control}>
        {button(-1)}
        <input
          type="text"
          inputMode="numeric"
          role="spinbutton"
          className="hl-qty__value w-full min-w-0 border-0 bg-transparent p-0 text-center font-[inherit] text-site-sm text-site-ink tabular-nums focus-visible:outline-offset-[-2px]"
          aria-labelledby={`${id}-label`}
          aria-describedby={described || undefined}
          aria-valuenow={value}
          aria-valuemin={row.min}
          aria-valuemax={row.max}
          aria-invalid={error ? true : undefined}
          data-hl-field-for={path}
          value={draft ?? String(value)}
          readOnly={!live}
          onChange={(event) => setDraft(event.target.value.replace(/\D/g, ''))}
          onBlur={commit}
          onKeyDown={onKeyDown}
        />
        {button(1)}
      </div>
    </div>
  );
}

/**
 * The quantity island: one stepper, or the extras list — a card row
 * per record (icon or photo, title, meta, unit price, stepper). It renders
 * the block's body from the server's JSON and the scope's live values
 * (`useScopeState`), dispatching `inc` / `dec` (with `key` for a record) and
 * `set`. The scope's own validation (`required`, bounds) words the error
 * under it.
 */
export function QuantityClient(props: QuantityClientProps): ReactElement {
  const { scope, uid } = props;
  const live = useLive(scope);
  const code = useScopeError(scope, props.path);
  const error = code ? (props.errors[code] ?? code) : '';

  return (
    <div className={props.list ? 'hl-qty hl-qty--list grid gap-3' : 'hl-qty'}>
      {props.rows.map((row, index) => (
        <Row
          key={row.key ?? index}
          props={props}
          row={row}
          id={`${uid}-${index}`}
          live={live}
          error={error}
        />
      ))}
      {error ? <WidgetError id={`${uid}-error`} text={error} icon={props.icons.warning} /> : null}
    </div>
  );
}
