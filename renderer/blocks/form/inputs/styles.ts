/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/* Plain Tailwind (decision 59); every class spelled out for Tailwind's scan.
   An invalid field (`aria-invalid`) takes the site's error border. */

/** A bare input, select or textarea. */
export const INPUT_CLASSES =
  'w-full rounded-site border border-site-hairline-strong bg-site-card px-3 py-2.25 font-[inherit] text-site-sm leading-[inherit] text-site-ink focus:border-site-accent focus:outline-none aria-invalid:border-site-error disabled:cursor-not-allowed';
export const TEXTAREA_CLASSES = `${INPUT_CLASSES} min-h-30 resize-y`;

/** The box of an input with an adornment (money's currency, phone's calling code). */
export const BOX_CLASSES =
  'flex w-full items-stretch overflow-hidden rounded-site border border-site-hairline-strong bg-site-card text-site-sm text-site-ink focus-within:border-site-accent has-[[aria-invalid=true]]:border-site-error';
/** The input inside a box: the box draws the border. */
export const BOX_INPUT_CLASSES =
  'min-w-0 flex-1 border-0 bg-transparent px-3 py-2.25 font-[inherit] text-site-sm leading-[inherit] text-site-ink focus:outline-none disabled:cursor-not-allowed';
/** The adornment's text, at either end of a box. */
export const ADORNMENT_CLASSES = 'flex shrink-0 items-center px-3 text-site-ink-soft';

/** The calendar's label and trigger drawn as the form's own (over W3's widget look). */
export const DATE_LABEL_CLASSES =
  'mb-1.5 text-site-sm font-normal normal-case tracking-normal text-site-ink';
export const DATE_TRIGGER_CLASSES = 'min-h-0 px-3 py-2.25 text-site-sm';
