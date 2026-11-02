/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Order keys in the encoding of the `fractional-indexing` package (base-62
 * digits, a head letter giving the integer part's length), so the keys built
 * here and the ones Hlou's editor mints with that package interleave.
 * This is the part of it the renderer needs to BUILD documents; the editing
 * API (`keyBetween`, `keysBetween`) is the editor's.
 */
const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ZERO = DIGITS[0] as string;
const LAST = DIGITS[DIGITS.length - 1] as string;
const SMALLEST_INTEGER = `A${ZERO.repeat(26)}`;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function integerLength(head: string): number {
  if (head >= 'a' && head <= 'z') return head.charCodeAt(0) - 'a'.charCodeAt(0) + 2;
  if (head >= 'A' && head <= 'Z') return 'Z'.charCodeAt(0) - head.charCodeAt(0) + 2;
  throw new Error(`Invalid order key head: ${head}`);
}

function integerPart(key: string): string {
  const length = integerLength(key.charAt(0));
  if (length > key.length) throw new Error(`Invalid order key: ${key}`);
  return key.slice(0, length);
}

function midpoint(a: string, b: string | null): string {
  if (b !== null && a >= b) throw new Error(`${a} >= ${b}`);
  if (b) {
    let n = 0;
    while ((a[n] ?? ZERO) === b[n]) n++;
    if (n > 0) return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
  }
  const digitA = a ? DIGITS.indexOf(a.charAt(0)) : 0;
  const digitB = b !== null ? DIGITS.indexOf(b.charAt(0)) : DIGITS.length;
  if (digitB - digitA > 1) return DIGITS.charAt(Math.round(0.5 * (digitA + digitB)));
  if (b && b.length > 1) return b.slice(0, 1);
  return DIGITS.charAt(digitA) + midpoint(a.slice(1), null);
}

function incrementInteger(x: string): string | null {
  const [head = '', ...digits] = x.split('');
  let carry = true;
  for (let i = digits.length - 1; carry && i >= 0; i--) {
    const next = DIGITS.indexOf(digits[i] as string) + 1;
    if (next === DIGITS.length) {
      digits[i] = ZERO;
    } else {
      digits[i] = DIGITS.charAt(next);
      carry = false;
    }
  }
  if (!carry) return head + digits.join('');
  if (head === 'Z') return `a${ZERO}`;
  if (head === 'z') return null;
  const nextHead = String.fromCharCode(head.charCodeAt(0) + 1);
  if (nextHead > 'a') digits.push(ZERO);
  else digits.pop();
  return nextHead + digits.join('');
}

function decrementInteger(x: string): string | null {
  const [head = '', ...digits] = x.split('');
  let borrow = true;
  for (let i = digits.length - 1; borrow && i >= 0; i--) {
    const next = DIGITS.indexOf(digits[i] as string) - 1;
    if (next === -1) {
      digits[i] = LAST;
    } else {
      digits[i] = DIGITS.charAt(next);
      borrow = false;
    }
  }
  if (!borrow) return head + digits.join('');
  if (head === 'a') return `Z${LAST}`;
  if (head === 'A') return null;
  const nextHead = String.fromCharCode(head.charCodeAt(0) - 1);
  if (nextHead < 'Z') digits.push(LAST);
  else digits.pop();
  return nextHead + digits.join('');
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * A key strictly between `a` and `b` (`null` = open end) — the same key
 * `fractional-indexing`'s `generateKeyBetween` returns for the same inputs.
 */
export function orderKeyBetween(a: string | null, b: string | null): string {
  if (a !== null && b !== null && a >= b) throw new Error(`${a} >= ${b}`);
  if (a === null) {
    if (b === null) return `a${ZERO}`;
    const ib = integerPart(b);
    const fb = b.slice(ib.length);
    if (ib === SMALLEST_INTEGER) return ib + midpoint('', fb);
    if (ib < b) return ib;
    const previous = decrementInteger(ib);
    if (previous === null) throw new Error('Cannot decrement the order key any more');
    return previous;
  }
  const ia = integerPart(a);
  const fa = a.slice(ia.length);
  if (b === null) {
    const next = incrementInteger(ia);
    return next === null ? ia + midpoint(fa, null) : next;
  }
  const ib = integerPart(b);
  const fb = b.slice(ib.length);
  if (ia === ib) return ia + midpoint(fa, fb);
  const next = incrementInteger(ia);
  if (next === null) throw new Error('Cannot increment the order key any more');
  return next < b ? next : ia + midpoint(fa, null);
}

/** `n` ascending keys for a fresh list: `a0`, `a1` … — `generateNKeysBetween(null, null, n)`. */
export function keysFor(n: number): string[] {
  const keys: string[] = [];
  let key: string | null = null;
  for (let i = 0; i < n; i++) {
    key = orderKeyBetween(key, null);
    keys.push(key);
  }
  return keys;
}
