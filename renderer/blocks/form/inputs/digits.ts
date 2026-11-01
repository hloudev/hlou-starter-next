/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Arabic-Indic (٠–٩) and Persian (۰–۹) digits as Latin ones: an Arabic
 * keyboard may type either, and the form stores and shows Latin digits.
 */
export function latinDigits(text: string): string {
  return text.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) =>
    String(digit.charCodeAt(0) & 0xf)
  );
}
