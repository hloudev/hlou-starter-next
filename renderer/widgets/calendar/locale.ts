/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { addDays, parseIso } from './dates';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** The `weekStart` prop: the locale's own first day, or a fixed one. */
export type WeekStart = 'locale' | 'monday' | 'sunday' | 'saturday';

/** Plural forms by `Intl.PluralRules` category, `{n}` the count (`StateMessages.nights`). */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

type WeekInfo = { firstDay?: number };
type LocaleWithWeek = Intl.Locale & { getWeekInfo?: () => WeekInfo; weekInfo?: WeekInfo };

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const FIXED: Record<Exclude<WeekStart, 'locale'>, number> = { monday: 1, sunday: 7, saturday: 6 };

/* Where `Intl` cannot say (Firefox has no `getWeekInfo`). CLDR's `ar` is
   `ar-EG`, whose week starts on Saturday; a Tunisian site sets Monday. */
const FIRST_DAY: Record<string, number> = { fr: 1, en: 7, ar: 6 };

/** A Monday: the weekday names are read off the week that follows it. */
const A_MONDAY = '2024-01-01';

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * The first day of the week (1 Monday … 7 Sunday): `weekStart` when it names
 * one, else the locale's from `Intl.Locale#getWeekInfo` / `weekInfo`, else a
 * table. **Computed on the server** and handed to the island as a prop, so a
 * browser without `getWeekInfo` never draws another grid.
 */
export function firstDayOfWeek(locale: string, weekStart: WeekStart = 'locale'): number {
  if (weekStart !== 'locale' && weekStart in FIXED) return FIXED[weekStart];
  try {
    const intl = new Intl.Locale(locale) as LocaleWithWeek;
    const day = (intl.getWeekInfo?.() ?? intl.weekInfo)?.firstDay;
    if (day && day >= 1 && day <= 7) return day;
  } catch {
    /* An invalid tag: the table's answer, or Monday. */
  }
  return FIRST_DAY[locale.toLowerCase().split(/[-_]/)[0] ?? ''] ?? 1;
}

/** The Intl locale: Arabic keeps Latin digits (`ar-u-nu-latn`), as the sites do. */
export function intlLocale(locale: string): string {
  return /^ar\b/i.test(locale) && !locale.includes('-u-') ? `${locale}-u-nu-latn` : locale;
}

/** A day through `Intl.DateTimeFormat`, in UTC so the day never shifts. */
export function formatDay(
  iso: string,
  locale: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: 'UTC', ...options }).format(
    parseIso(iso)
  );
}

/** The seven weekdays from `firstDay`, each `[narrow, long]`. */
export function weekdayNames(locale: string, firstDay: number): Array<[string, string]> {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(A_MONDAY, (firstDay - 1 + i) % 7);
    return [
      formatDay(day, locale, { weekday: 'narrow' }),
      formatDay(day, locale, { weekday: 'long' }),
    ];
  });
}

/** « 3 nuits »: the plural form `Intl.PluralRules` picks, the count in the locale's digits. */
export function pluralText(n: number, forms: PluralForms, locale: string): string {
  const intl = intlLocale(locale);
  const form = forms[new Intl.PluralRules(intl).select(n)] ?? forms.other;
  return form.replace('{n}', new Intl.NumberFormat(intl).format(n));
}
