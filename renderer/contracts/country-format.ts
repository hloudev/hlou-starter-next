/* -------------------------------------------------------------------------- */
/*                                  COUNTRIES                                 */
/* -------------------------------------------------------------------------- */

/*
 * The zod-free half of `country.ts`: the country list and the phone and
 * country display helpers a browser island draws with (`blocks/shared.tsx`),
 * without the schemas. `country.ts` re-exports every one.
 */

/** Every ISO 3166-1 alpha-2 code: the 249 officially assigned, nothing user-assigned (`XK`). */
export const COUNTRY_CODES: readonly string[] = /* @__PURE__ */ Object.freeze([
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS',
  'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
  'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE',
  'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF',
  'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
  'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM',
  'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC',
  'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
  'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA',
  'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG',
  'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS',
  'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO',
  'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
  'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW',
]); // prettier-ignore

const COUNTRY_SET = /* @__PURE__ */ new Set(COUNTRY_CODES);

export function isCountryCode(code: string): boolean {
  return COUNTRY_SET.has(code);
}

/** `TN` → « Tunisie » in French, « تونس » in Arabic; the code itself where `Intl` cannot say. */
export function countryName(code: string, locale: string): string {
  const DisplayNames = (Intl as { DisplayNames?: typeof Intl.DisplayNames }).DisplayNames;
  if (typeof DisplayNames !== 'function') return code;
  try {
    if (DisplayNames.supportedLocalesOf([locale]).length === 0) return code;
    return new DisplayNames([locale], { type: 'region', fallback: 'code' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** `TN` → 🇹🇳, from the two regional-indicator letters. */
export function countryFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

/* -------------------------------------------------------------------------- */
/*                                   PHONES                                   */
/* -------------------------------------------------------------------------- */

/** E.164: a plus, a country code that does not start with 0, 7 to 15 digits in all. */
export const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

/** « +216 98.123-456 » → `+21698123456`: spaces, dots, dashes and parentheses go. */
export function normalizePhone(value: string): string {
  return value.trim().replace(/[\s.()-]/g, '');
}

/*
 * ITU zones: the one-digit country codes, then the two-digit ones; every
 * other code has three digits. Codes are prefix-free, so this is exact.
 */
const ONE_DIGIT_CODES = /* @__PURE__ */ new Set(['1', '7']);
const TWO_DIGIT_CODES = /* @__PURE__ */ new Set(
  '20 27 30 31 32 33 34 36 39 40 41 43 44 45 46 47 48 49 51 52 53 54 55 56 57 58 60 61 62 63 64 65 66 81 82 84 86 90 91 92 93 94 95 98'.split(
    ' '
  )
);

/** `+21698123456` → `216`. */
export function dialCode(e164: string): string {
  const digits = e164.slice(1);
  if (ONE_DIGIT_CODES.has(digits.slice(0, 1))) return digits.slice(0, 1);
  if (TWO_DIGIT_CODES.has(digits.slice(0, 2))) return digits.slice(0, 2);
  return digits.slice(0, 3);
}

/** How a national number of that many digits splits for reading. */
function groupSizes(length: number): number[] {
  if (length === 8) return [2, 3, 3];
  if (length === 9) return [1, 2, 2, 2, 2];
  if (length === 10) return [3, 3, 4];
  const sizes: number[] = [];
  for (let rest = length; rest > 0; rest -= 3) sizes.push(Math.min(3, rest));
  return sizes;
}

/**
 * « +216 98 123 456 », « +33 6 12 34 56 78 », « +1 415 555 0123 ». A reading
 * aid, not a carrier-aware format; anything that is not E.164 comes back as is.
 */
export function formatPhone(e164: string): string {
  if (!E164_PATTERN.test(e164)) return e164;
  const code = dialCode(e164);
  const national = e164.slice(1 + code.length);
  const groups: string[] = [];
  let at = 0;
  for (const size of groupSizes(national.length)) {
    groups.push(national.slice(at, at + size));
    at += size;
  }
  return `+${code} ${groups.join(' ')}`;
}
