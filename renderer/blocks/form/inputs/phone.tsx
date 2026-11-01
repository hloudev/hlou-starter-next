/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { useState } from 'react';

import type { ReactElement } from 'react';
import { latinDigits } from './digits';
import { ADORNMENT_CLASSES, BOX_CLASSES, BOX_INPUT_CLASSES } from './styles';

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Every ISO 3166-1 alpha-2 code with its calling code, as one string (`AD376`
 * = Andorra, +376): the same 249 codes as `COUNTRY_CODES`, kept here so the
 * island never loads the contracts. Territories share their parent's code
 * (`GG44`, `PR1`); Antarctica reads `672`.
 */
const CALLING_CODES =
  'AD376AE971AF93AG1AI1AL355AM374AO244AQ672AR54AS1AT43AU61AW297AX358AZ994BA387BB1BD880BE32' +
  'BF226BG359BH973BI257BJ229BL590BM1BN673BO591BQ599BR55BS1BT975BV47BW267BY375BZ501CA1CC61' +
  'CD243CF236CG242CH41CI225CK682CL56CM237CN86CO57CR506CU53CV238CW599CX61CY357CZ420DE49DJ253' +
  'DK45DM1DO1DZ213EC593EE372EG20EH212ER291ES34ET251FI358FJ679FK500FM691FO298FR33GA241GB44GD1' +
  'GE995GF594GG44GH233GI350GL299GM220GN224GP590GQ240GR30GS500GT502GU1GW245GY592HK852HM672' +
  'HN504HR385HT509HU36ID62IE353IL972IM44IN91IO246IQ964IR98IS354IT39JE44JM1JO962JP81KE254' +
  'KG996KH855KI686KM269KN1KP850KR82KW965KY1KZ7LA856LB961LC1LI423LK94LR231LS266LT370LU352' +
  'LV371LY218MA212MC377MD373ME382MF590MG261MH692MK389ML223MM95MN976MO853MP1MQ596MR222MS1' +
  'MT356MU230MV960MW265MX52MY60MZ258NA264NC687NE227NF672NG234NI505NL31NO47NP977NR674NU683' +
  'NZ64OM968PA507PE51PF689PG675PH63PK92PL48PM508PN64PR1PS970PT351PW680PY595QA974RE262RO40' +
  'RS381RU7RW250SA966SB677SC248SD249SE46SG65SH290SI386SJ47SK421SL232SM378SN221SO252SR597' +
  'SS211ST239SV503SX1SY963SZ268TC1TD235TF262TG228TH66TJ992TK690TL670TM993TN216TO676TR90TT1' +
  'TV688TW886TZ255UA380UG256UM1US1UY598UZ998VA39VC1VE58VG1VI1VN84VU678WF681WS685YE967YT262' +
  'ZA27ZM260ZW263';

let table: Map<string, string> | null = null;

/** E.164's own bounds: a country code that does not start with 0, 7 to 15 digits in all. */
const E164 = /^\+[1-9]\d{6,14}$/;

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** `TN` → `216`; `undefined` for a code the table does not hold. */
export function callingCode(country: string): string | undefined {
  table ??= new Map(
    [...CALLING_CODES.matchAll(/([A-Z]{2})(\d+)/g)].map(([, code = '', dial = '']) => [code, dial])
  );
  return table.get(country);
}

/** `TN` → 🇹🇳, from the two regional-indicator letters. */
export function flagOf(country: string): string {
  if (!/^[A-Z]{2}$/.test(country)) return '';
  return String.fromCodePoint(...[...country].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

/**
 * A number as E.164, `null` when blank, `'invalid'` otherwise. « 098 123 456 »
 * with `TN` → `+21698123456`: spaces, dots, dashes and parentheses go, the
 * national leading `0` is dropped, 4 to 14 national digits are kept. A
 * number typed with `+` or `00` carries its own country code.
 */
export function toE164(country: string, text: string): string | null | 'invalid' {
  const typed = latinDigits(text)
    .trim()
    .replace(/[\s.()-]/g, '');
  if (typed === '') return null;
  const international = /^(\+|00)(\d+)$/.exec(typed);
  if (international) return E164.test(`+${international[2]}`) ? `+${international[2]}` : 'invalid';
  const code = callingCode(country);
  const national = typed.replace(/^0/, '');
  if (!code || !/^\d{4,14}$/.test(national)) return 'invalid';
  return E164.test(`+${code}${national}`) ? `+${code}${national}` : 'invalid';
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * A phone number: the calling-code select (it reads « 🇹🇳 +216 » closed; its
 * options name the countries) and a `tel` input, left to right in every
 * language. The select posts `<name>:cc`; `toE164` joins the two.
 */
export function PhoneInput(props: {
  id: string;
  name: string;
  /** `[code, name]`, sorted in the page's language. */
  countries: ReadonlyArray<readonly [string, string]>;
  defaultCountry: string;
  dialLabel: string;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  describedBy?: string;
}): ReactElement {
  const [country, setCountry] = useState(props.defaultCountry);
  const code = callingCode(country);
  return (
    <div className={BOX_CLASSES} dir="ltr">
      <span
        className={`relative ${ADORNMENT_CLASSES} gap-1.5 border-e border-site-hairline-strong`}
      >
        <span aria-hidden="true">{code ? `${flagOf(country)} +${code}` : '+…'}</span>
        <select
          name={`${props.name}:cc`}
          value={country}
          onChange={(event) => setCountry(event.currentTarget.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label={props.dialLabel}
          disabled={props.disabled}
        >
          <option value="">+…</option>
          {props.countries.flatMap(([value, label]) => {
            const dial = callingCode(value);
            return dial ? (
              <option key={value} value={value}>
                {`${flagOf(value)} ${label} +${dial}`}
              </option>
            ) : (
              []
            );
          })}
        </select>
      </span>
      <input
        id={props.id}
        name={props.name}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className={BOX_INPUT_CLASSES}
        disabled={props.disabled}
        aria-required={props.required || undefined}
        aria-invalid={props.invalid || undefined}
        aria-describedby={props.describedBy}
      />
    </div>
  );
}
