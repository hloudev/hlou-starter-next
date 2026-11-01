/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/* Calendar maths on `YYYY-MM-DD` strings (M40-12), read as UTC midnights: a
   calendar day has no time zone, so no offset can shift it. ISO strings
   compare as strings. Pure, no Intl: shared by the server shell, the island
   and the form (F3). */

/** A date range's value (README « Value shapes »); `to` is `null` while picking. */
export type DateRange = { from: string; to: string | null };

/** What makes a day unselectable. `from`: the arrival, while the departure is being picked. */
export type DayRules = {
  min?: string;
  disabled?: readonly string[];
  from?: string | null;
  minNights?: number;
  maxNights?: number;
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const DAY_MS = 86_400_000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** A real calendar day in `YYYY-MM-DD` (`2027-02-30` is not one). */
export function isIsoDay(value: unknown): value is string {
  return typeof value === 'string' && ISO.test(value) && toIso(parseIso(value)) === value;
}

/** A `YYYY-MM-DD` as its UTC midnight. */
export function parseIso(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

/** A date's UTC day as `YYYY-MM-DD`; `''` for an invalid date. */
export function toIso(date: Date): string {
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return toIso(new Date(parseIso(iso).getTime() + days * DAY_MS));
}

/** `months` later (or earlier), the day kept where the month has it, else its last day. */
export function addMonths(iso: string, months: number): string {
  const date = parseIso(iso);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return toIso(date);
}

/** The first day of `iso`'s month. */
export function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

/** Whole nights from `from` to `to`. */
export function nightsBetween(from: string, to: string): number {
  return Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / DAY_MS);
}

/** The ISO weekday: 1 Monday … 7 Sunday (the numbering `Intl.Locale#getWeekInfo` uses). */
export function weekday(iso: string): number {
  return parseIso(iso).getUTCDay() || 7;
}

/** The first day of `iso`'s week, for a week starting on `firstDay` (1–7). */
export function weekStartOf(iso: string, firstDay: number): string {
  return addDays(iso, -((weekday(iso) - firstDay + 7) % 7));
}

/** Six weeks of seven days covering `iso`'s month, from `firstDay`'s week. */
export function monthMatrix(iso: string, firstDay: number): string[][] {
  const start = weekStartOf(monthStart(iso), firstDay);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day))
  );
}

/**
 * Whether `day` cannot be picked. An arrival (or a single date) must be on
 * or after `min` and not listed in `disabled`. While the departure is picked
 * (`from` set), a day after the arrival must keep the stay within
 * `minNights` / `maxNights` and not span a disabled night — the departure
 * day itself may be one; a day on or before the arrival restarts the range,
 * so it follows the arrival's rules.
 */
export function isDisabled(day: string, rules: DayRules): boolean {
  const { from, disabled = [] } = rules;
  if (from && day > from) {
    const nights = nightsBetween(from, day);
    if (rules.minNights !== undefined && nights < rules.minNights) return true;
    if (rules.maxNights !== undefined && nights > rules.maxNights) return true;
    return disabled.some((off) => off >= from && off < day);
  }
  return (rules.min !== undefined && day < rules.min) || disabled.includes(day);
}

/** Today in the visitor's own time zone, as `YYYY-MM-DD` (Swedish writes dates the ISO way). */
export function todayLocal(now: Date = new Date()): string {
  return now.toLocaleDateString('sv-SE');
}
