/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { E164_PATTERN, isCountryCode, normalizePhone } from './country-format';

/* The list and display helpers, free of zod for the browser (`country-format.ts`). */
export {
  COUNTRY_CODES,
  countryFlag,
  countryName,
  dialCode,
  E164_PATTERN,
  formatPhone,
  isCountryCode,
  normalizePhone,
} from './country-format';

/* -------------------------------------------------------------------------- */
/*                                  COUNTRIES                                 */
/* -------------------------------------------------------------------------- */

/*
 * The `phone` and `country` value shapes of decision 200, with their display
 * helpers. Pure — zod and `Intl` only, no phone or country library — so the
 * server validator, the site's inputs and mobile agree on one list.
 */

/** `tn` → `TN`; then two letters on the list, or refused. */
export const countryValueSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(
    z
      .string()
      .regex(/^[A-Z]{2}$/)
      .refine(isCountryCode, { error: 'Unknown country' })
  );

/* -------------------------------------------------------------------------- */
/*                                   PHONES                                   */
/* -------------------------------------------------------------------------- */

/** A phone is stored normalised, so the same number is always the same string. */
export const phoneValueSchema = z
  .string()
  .transform(normalizePhone)
  .pipe(z.string().regex(E164_PATTERN, { error: 'Expected an E.164 phone number' }));
