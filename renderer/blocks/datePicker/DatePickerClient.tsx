'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useSyncExternalStore } from 'react';

import type { ReactElement } from 'react';
import type { CalendarValue, DateFieldProps } from '../../widgets/calendar';

import { useScopeState } from '../../state/react';
import { getScope } from '../../state/store';
import { DateField, rangeOf } from '../../widgets/calendar';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type DatePickerClientProps = Omit<DateFieldProps, 'onChange' | 'error' | 'fieldFor'> & {
  /** The scope's id (`__hl.scope.id`); `''` when unbound. */
  scope: string;
  /** The bound field's key. */
  path: string;
  /** The scope's error copy, by the code the store writes in `errors`. */
  errors: Record<string, string>;
  /** The error code of the server's snapshot (the canvas's « Afficher les erreurs »). */
  error?: string | null;
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const subscribeNever = () => () => undefined;

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * The date picker island: the `DateField` bound to one `date` /
 * `dateRange` field of its scope through `useScopeState`. A range is written
 * end by end (`set` takes a primitive): the field cleared, then `<path>.from`,
 * then `<path>.to`. The server's texts serve until the value changes, so the
 * hydration never re-formats a date. Inert in the canvas and when unbound.
 */
export function DatePickerClient(props: DatePickerClientProps): ReactElement {
  const { scope, path, errors, inert } = props;
  const id = inert ? '' : scope;
  const [value, dispatch] = useScopeState<CalendarValue>(id, path, props.value);
  const store = id && typeof document !== 'undefined' ? getScope(id) : null;
  const code = useSyncExternalStore(
    store ? store.subscribe : subscribeNever,
    () => (store ? (store.get().errors[path] ?? null) : (props.error ?? null)),
    () => props.error ?? null
  );

  const onChange = (next: CalendarValue) => {
    if (props.mode === 'single') {
      dispatch({ do: 'set', path, value: typeof next === 'string' ? next : null });
      return;
    }
    const range = rangeOf(next);
    dispatch({ do: 'set', path, value: null });
    if (range) dispatch({ do: 'set', path: `${path}.from`, value: range.from });
    if (range?.to) dispatch({ do: 'set', path: `${path}.to`, value: range.to });
  };

  return (
    <DateField
      {...props}
      value={value}
      texts={value === props.value ? props.texts : null}
      error={code ? (errors[code] ?? code) : null}
      fieldFor={path || undefined}
      onChange={onChange}
    />
  );
}
