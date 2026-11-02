'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react';

import type { CSSProperties, FormEvent, ReactElement } from 'react';
import type { FieldDoc } from '../../contracts';
import type { ScopeStore } from '../../state/store';
import type { CalendarValue, DateFieldLabels } from '../../widgets/calendar';
import type { FromStateEntry } from './scope';
import type { FieldErrorCode, ReadInput } from './validate';
import { CountrySelect } from './inputs/country';
import { MoneyInput } from './inputs/money';
import { PhoneInput } from './inputs/phone';
import {
  DATE_LABEL_CLASSES,
  DATE_TRIGGER_CLASSES,
  INPUT_CLASSES,
  TEXTAREA_CLASSES,
} from './inputs/styles';
import { formState, fromStateData } from './scope';
import { DIAL_SUFFIX, fieldCountry, fieldCurrency, readFields } from './validate';

import { prefixHref } from '../../resolve/href';
import { HONEYPOT_FIELD } from '../../site/forms';
import { getScope } from '../../state/store';
import { DateField } from '../../widgets/calendar';
import { WidgetError } from '../widget-client';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type FormClientProps = {
  blockId: string;
  formKey: string;
  locale: string;
  dir: 'ltr' | 'rtl';
  /** Empty → the form renders disabled (no endpoint to post to). */
  endpoint: string;
  /** A preview build's id — the submission then lands in the Sandbox. */
  buildId?: string;
  fields: FieldDoc[];
  submitLabel: string;
  successMessage: string;
  errorMessage: string;
  /** The `<form>` (`form` element) and its submit button (`submit`). */
  formAttrs: ElementAttrs;
  submitAttrs: ElementAttrs;
  /** Each field error's words (`StateMessages`), by code. */
  messages: Record<FieldErrorCode, string>;
  /** The phone field's calling-code select (`StateMessages.form.dialCode`). */
  dialLabel: string;
  /** `warning-circle`'s path data, for the error line. */
  errorIcon: string[];
  /** `[code, name]` sorted in the page's language: set when a phone or country field is drawn. */
  countries?: Array<[string, string]>;
  /** The calendar's first weekday and copy: set when a date range field is drawn. */
  dates?: { firstDay: number; labels: DateFieldLabels };
  /** Inside a scope on a published page: validate on its step, submit on its `submit`. */
  inScope: boolean;
  /** The step the form is shown on (`__hl.step`), `null` on every step. */
  step: string | null;
  /** Fields posted from the scope rather than typed (drawn as nothing); set inside a scope. */
  fromState?: FromStateEntry[];
  /** No submit button: a scope button sends the form. */
  hideSubmit?: boolean;
  /**
   * The page's base path (`/fr`): a site-path redirect is prefixed with it, as
   * the resolver prefixes every link. Without it, `/reservation/merci?record=…`
   * lands on the unprefixed path's static redirect stub, whose
   * `<meta http-equiv="refresh">` drops the query.
   */
  basePath?: string;
};

/** A styleable element's attributes, computed by the server shell (`blockParts`). */
export type ElementAttrs = {
  className: string;
  style?: CSSProperties;
  'data-hl-field'?: string;
};

type Status = 'idle' | 'sending' | 'sent' | 'error';

type SelectOption = { label: string; value: string };

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const STATUS_CLASSES = {
  sent: 'rounded-site bg-site-accent-soft px-3.5 py-2.5 text-site-sm text-site-ink',
  error:
    'rounded-site bg-[color-mix(in_srgb,var(--site-ink)_8%,var(--site-paper))] px-3.5 py-2.5 text-site-sm text-site-ink',
} as const;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function readOptions(options: unknown): SelectOption[] {
  if (!Array.isArray(options)) return [];
  return options.flatMap((option): SelectOption[] => {
    if (typeof option === 'string') return [{ label: option, value: option }];
    if (typeof option === 'object' && option !== null) {
      const record = option as Record<string, unknown>;
      const value = typeof record.value === 'string' ? record.value : undefined;
      if (!value) return [];
      return [{ label: typeof record.label === 'string' ? record.label : value, value }];
    }
    return [];
  });
}

function inputType(field: FieldDoc): string {
  switch (field.type) {
    case 'email':
      return 'email';
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    default:
      return 'text';
  }
}

/** The form's inputs by name, as `readFields` reads them. */
function formReader(form: HTMLFormElement): ReadInput {
  const data = new FormData(form);
  return (name) => {
    const value = data.get(name);
    return typeof value === 'string' ? value : null;
  };
}

/** The element a field's error focuses: the calendar's trigger, else the input. */
function focusId(blockId: string, field: FieldDoc): string {
  return `${blockId}-${field.key}${field.type === 'daterange' ? '-b' : ''}`;
}

/**
 * Inside a scope, every step in order (the form's own validator runs with its
 * step); the first that fails is shown, then checked again so the focus lands
 * on a field the visitor can see.
 */
function validateScope(store: ScopeStore): boolean {
  const steps = store.def.steps.map((step) => step.id);
  for (const step of steps.length > 0 ? steps : [undefined]) {
    if (store.validate(step)) continue;
    if (step !== undefined && store.get().step !== step) {
      store.dispatch({ do: 'step.go', step });
      store.validate(step);
    }
    return false;
  }
  return true;
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * The form block's island: the fields of its collection form, each checked
 * on submit with its own message under it (`aria-invalid`, `aria-describedby`,
 * focus on the first), then posted as JSON.
 *
 * **A form inside a scope** — one form block per scope, on the
 * step where the visitor types (« Vos coordonnées »). The scope's
 * own fields (dates, guests, extras) are the scope's, validated by the scope
 * per step, and reach the record through `fromState`; the form validates its
 * own inputs. The island finds its scope from the DOM (`closest('[data-hl-scope]')`,
 * then `getScope`; a nested scope counts as none) and:
 *
 * - registers its inputs' check as the validator of its step (`__hl.step`), so
 *   « Continuer » stays put until they are valid;
 * - sends itself on the scope's `submit` (a `{ do: 'submit' }` button), after
 *   validating every step — the first failing step is shown, its own included;
 * - posts the `fromState` values and the scope's `state` (`{ values, derived,
 *   estimate: true }`, dropped above 16 KB, never stored);
 * - on success calls `store.submitted()`: the scope resets and its storage clears.
 */
export function FormClient(props: FormClientProps): ReactElement {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Partial<Record<string, FieldErrorCode>>>({});
  const [ranges, setRanges] = useState<Record<string, CalendarValue>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const scopeRef = useRef<ScopeStore | null>(null);
  const rangesRef = useRef(ranges);
  const disabled = props.endpoint === '' || status === 'sending' || status === 'sent';
  const fromKeys = new Set((props.fromState ?? []).map((entry) => entry.field));
  const drawn = props.fields.filter((field) => !fromKeys.has(field.key));

  /** The drawn inputs' check: errors shown, the first invalid focused on demand. */
  const check = (focus: boolean): boolean => {
    const form = formRef.current;
    if (!form) return true;
    const found = readFields(drawn, formReader(form), rangesRef.current).errors;
    setErrors(found);
    const first = drawn.find((field) => found[field.key]);
    if (first && focus) document.getElementById(focusId(props.blockId, first))?.focus();
    return !first;
  };
  const checkRef = useRef(check);

  useEffect(() => {
    rangesRef.current = ranges;
    checkRef.current = check;
  });

  useEffect(() => {
    const scope = props.inScope ? formRef.current?.closest('[data-hl-scope]') : null;
    const id = scope?.parentElement?.closest('[data-hl-scope]')
      ? null
      : scope?.getAttribute('data-hl-scope');
    const store = id ? getScope(id) : null;
    if (!store) return;
    scopeRef.current = store;
    const offValidator = store.registerValidator(props.step, () => checkRef.current(true));
    const offSubmit = store.on('submit', () => formRef.current?.requestSubmit());
    return () => {
      offValidator();
      offSubmit();
      scopeRef.current = null;
    };
  }, [props.inScope, props.step]);

  const clear = (key: string) =>
    setErrors((current) => {
      if (!current[key]) return current;
      const { [key]: _cleared, ...rest } = current;
      return rest;
    });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const form = event.currentTarget;
    const store = scopeRef.current;
    if (!(store ? validateScope(store) : check(true))) return;
    if (honeypotRef.current?.value) return;

    const typed = readFields(drawn, formReader(form), ranges).data;
    const fromState =
      store && props.fromState
        ? fromStateData(store, props.fromState, props.fields, props.locale)
        : {};
    const state = store ? formState(store.get()) : undefined;
    setStatus('sending');
    try {
      const response = await fetch(props.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(props.buildId ? { 'X-Hlou-Build': props.buildId } : {}),
        },
        body: JSON.stringify({
          formKey: props.formKey,
          locale: props.locale,
          data: { ...typed, ...fromState },
          ...(state ? { state } : {}),
        }),
      });
      if (!response.ok) return setStatus('error');
      store?.submitted();
      /* The form's redirect: a site path or https, else the success message. */
      const { data } = ((await response.json().catch(() => ({}))) ?? {}) as {
        data?: { redirect?: unknown };
      };
      if (typeof data?.redirect === 'string' && /^(\/(?![/\\])|https:\/\/)/.test(data.redirect)) {
        return window.location.assign(prefixHref(data.redirect, props.basePath ?? ''));
      }
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <form
      ref={formRef}
      {...props.formAttrs}
      onSubmit={handleSubmit}
      onChange={(event) => {
        /* Typing in a field clears its error (the phone's select clears the number's). */
        const { name } = event.target as { name?: unknown };
        if (typeof name === 'string' && name) clear(name.replace(DIAL_SUFFIX, ''));
      }}
      noValidate
      data-hl-form={props.formKey}
      data-hl-endpoint={props.endpoint || undefined}
    >
      {drawn.map((field) => {
        const id = `${props.blockId}-${field.key}`;
        const error = errors[field.key];
        const errorId = error ? `${id}-error` : undefined;
        const errorLine = error ? (
          <WidgetError id={`${id}-error`} text={props.messages[error]} icon={props.errorIcon} />
        ) : null;
        const own = {
          id,
          name: field.key,
          disabled,
          required: field.required,
          invalid: Boolean(error),
          describedBy: errorId,
        };
        if (field.type === 'boolean') {
          return (
            <label key={field.key} className="flex items-center gap-2 text-site-sm" htmlFor={id}>
              <input id={id} name={field.key} type="checkbox" disabled={disabled} />
              <span>{field.label}</span>
            </label>
          );
        }
        if (field.type === 'daterange') {
          return props.dates ? (
            <div key={field.key}>
              <DateField
                id={id}
                mode="range"
                look="field"
                months="auto"
                value={ranges[field.key] ?? null}
                label={field.required ? `${field.label} *` : field.label}
                fromLabel=""
                toLabel=""
                labels={props.dates.labels}
                firstDay={props.dates.firstDay}
                locale={props.locale}
                dir={props.dir}
                inert={disabled}
                error={error ? props.messages[error] : null}
                elements={{
                  label: { className: DATE_LABEL_CLASSES },
                  field: { className: DATE_TRIGGER_CLASSES },
                }}
                onChange={(value) => {
                  setRanges((current) => ({ ...current, [field.key]: value }));
                  clear(field.key);
                }}
              />
            </div>
          ) : null;
        }
        return (
          <div key={field.key} className="grid gap-1.5">
            <label className="text-site-sm" htmlFor={id}>
              {field.label}
              {field.required ? (
                <span className="ms-0.5 text-site-accent" aria-hidden="true">
                  *
                </span>
              ) : null}
            </label>
            {field.type === 'richtext' ? (
              <textarea
                id={id}
                name={field.key}
                className={TEXTAREA_CLASSES}
                required={field.required}
                disabled={disabled}
                aria-invalid={own.invalid || undefined}
                aria-describedby={errorId}
              />
            ) : field.type === 'select' ? (
              <select
                id={id}
                name={field.key}
                className={INPUT_CLASSES}
                required={field.required}
                disabled={disabled}
                defaultValue=""
                aria-invalid={own.invalid || undefined}
                aria-describedby={errorId}
              >
                <option value="" />
                {readOptions(field.options).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'money' ? (
              <MoneyInput {...own} currency={fieldCurrency(field)} />
            ) : field.type === 'phone' ? (
              <PhoneInput
                {...own}
                countries={props.countries ?? []}
                defaultCountry={fieldCountry(field)}
                dialLabel={props.dialLabel}
              />
            ) : field.type === 'country' ? (
              <CountrySelect
                {...own}
                countries={props.countries ?? []}
                defaultCountry={fieldCountry(field)}
              />
            ) : (
              <input
                id={id}
                name={field.key}
                type={inputType(field)}
                className={INPUT_CLASSES}
                required={field.required}
                disabled={disabled}
                aria-invalid={own.invalid || undefined}
                aria-describedby={errorId}
              />
            )}
            {errorLine}
          </div>
        );
      })}
      <div className="absolute -start-[9999px] size-px overflow-hidden" aria-hidden="true">
        <input
          ref={honeypotRef}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {status === 'sent' ? (
        <p className={STATUS_CLASSES.sent} role="status">
          {props.successMessage}
        </p>
      ) : status === 'error' ? (
        <p className={STATUS_CLASSES.error} role="alert">
          {props.errorMessage}
        </p>
      ) : null}
      {props.hideSubmit ? null : (
        <div>
          <button type="submit" {...props.submitAttrs} disabled={disabled}>
            {props.submitLabel}
          </button>
        </div>
      )}
    </form>
  );
}
