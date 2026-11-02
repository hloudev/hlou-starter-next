/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import { latinDigits } from './digits';
import { ADORNMENT_CLASSES, BOX_CLASSES, BOX_INPUT_CLASSES } from './styles';

import { currencyDigits } from '../../../state/values';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** `amount` in the currency's minor units. */
export type MoneyInputValue = { amount: number; currency: string };

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * What a visitor typed as an amount in `currency`: `{ amount, currency }`
 * in minor units (TND « 12,5 » → 12 500, EUR « 12.50 » → 1 250), `null`
 * when blank, `'invalid'` otherwise. `,` and `.` both separate the fraction
 * (one of them, once); spaces group thousands; more fraction digits than
 * the currency has are refused, never rounded.
 */
export function parseMoney(text: string, currency: string): MoneyInputValue | null | 'invalid' {
  const bare = latinDigits(text).replace(/\s/g, '');
  if (bare === '') return null;
  const match = /^(\d+)(?:[.,](\d*))?$/.exec(bare);
  const digits = currencyDigits(currency);
  const fraction = match?.[2] ?? '';
  if (!match || fraction.length > digits) return 'invalid';
  const amount = Number(match[1]) * 10 ** digits + Number(fraction.padEnd(digits, '0'));
  return Number.isSafeInteger(amount) ? { amount, currency } : 'invalid';
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * An amount: a decimal text input and the field's currency as a fixed
 * adornment (« TND »). Read back through the form's data (`parseMoney`).
 */
export function MoneyInput(props: {
  id: string;
  name: string;
  currency: string;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  describedBy?: string;
}): ReactElement {
  return (
    <div className={BOX_CLASSES} dir="ltr">
      <input
        id={props.id}
        name={props.name}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={BOX_INPUT_CLASSES}
        disabled={props.disabled}
        aria-required={props.required || undefined}
        aria-invalid={props.invalid || undefined}
        aria-describedby={[props.describedBy, `${props.id}-currency`].filter(Boolean).join(' ')}
      />
      <span id={`${props.id}-currency`} className={ADORNMENT_CLASSES}>
        {props.currency}
      </span>
    </div>
  );
}
