/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

/* The calendar core (M40-12): the date picker block and the form's
   `daterange` field (F3) draw the same calendar. No scope import. */
export * from './dates';
export * from './locale';
export { Calendar } from './Calendar';
export { dateFieldTexts, rangeOf } from './texts';
export type { CalendarLabels, CalendarProps, CalendarValue } from './Calendar';
export { DateField } from './DateField';
export type { DateFieldElement, DateFieldLabels, DateFieldProps } from './DateField';
