/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import { INPUT_CLASSES } from './styles';

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** The list with the field's default country first (when it has one). */
export function countryChoices(
  countries: ReadonlyArray<readonly [string, string]>,
  first: string
): ReadonlyArray<readonly [string, string]> {
  const lead = countries.find(([code]) => code === first);
  return lead ? [lead, ...countries.filter((entry) => entry !== lead)] : countries;
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * A country: a select of ISO 3166-1 alpha-2 codes named in the page's
 * language, sorted by the server (`Intl.DisplayNames` + `Intl.Collator`, so
 * the hydration never re-sorts), the field's default first. Posts the code.
 */
export function CountrySelect(props: {
  id: string;
  name: string;
  countries: ReadonlyArray<readonly [string, string]>;
  defaultCountry: string;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  describedBy?: string;
}): ReactElement {
  return (
    <select
      id={props.id}
      name={props.name}
      className={INPUT_CLASSES}
      disabled={props.disabled}
      defaultValue=""
      aria-required={props.required || undefined}
      aria-invalid={props.invalid || undefined}
      aria-describedby={props.describedBy}
    >
      <option value="" />
      {countryChoices(props.countries, props.defaultCountry).map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}
