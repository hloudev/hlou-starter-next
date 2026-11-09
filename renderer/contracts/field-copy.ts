/* -------------------------------------------------------------------------- */
/*                                 FIELD COPY                                 */
/* -------------------------------------------------------------------------- */

/**
 * What a visitor reads around a form input, per site locale: the field's
 * label, its placeholder, a select's choice labels.
 *
 * A collection field stores them in its `options` as locale maps
 * (`{ labels: { en: "First name" }, placeholders: { … }, choices: [{ value,
 * label, labels }] }`), the shape record values already use for a localized
 * cell. Its `label` stays the source locale's and is the fallback. This is
 * not the field's Localizable switch: that one makes a record's VALUE
 * per-locale, and a form's submissions are never translated.
 *
 * The two compilers (Hlou's `toSiteData`, the starter's `compileField`) carry
 * the maps onto the `FieldDoc` through `fieldCopy`; the resolver then hands a
 * form the field as one locale reads it (`localizeField`).
 */
export type LocaleText = Record<string, string>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A locale map's non-blank strings, or `undefined` when none is left. */
export function localeText(value: unknown): LocaleText | undefined {
  if (!isPlainObject(value)) return undefined;
  const out: LocaleText = {};
  for (const [locale, text] of Object.entries(value)) {
    if (typeof text === 'string' && text.trim()) out[locale] = text;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** A stored field's `options.labels` / `options.placeholders`, for its `FieldDoc`. */
export function fieldCopy(options: unknown): { labels?: LocaleText; placeholders?: LocaleText } {
  if (!isPlainObject(options)) return {};
  const labels = localeText(options.labels);
  const placeholders = localeText(options.placeholders);
  return {
    ...(labels ? { labels } : {}),
    ...(placeholders ? { placeholders } : {}),
  };
}

/** The text for `locale`, then for its language alone (`en-GB` → `en`). */
export function pickLocaleText(map: unknown, locale: string): string | undefined {
  const text = localeText(map);
  if (!text) return undefined;
  return text[locale] ?? text[locale.split('-')[0] ?? ''];
}

interface CopyField {
  label: string;
  options?: unknown;
  labels?: LocaleText;
  placeholders?: LocaleText;
  placeholder?: string;
}

/** A select choice with its label in `locale`; its `labels` map stays behind. */
function localizeChoice(choice: unknown, locale: string, source: string): unknown {
  if (!isPlainObject(choice)) return choice;
  const { labels, ...rest } = choice;
  const label = locale === source ? undefined : pickLocaleText(labels, locale);
  return label ? { ...rest, label } : rest;
}

/**
 * The field as a page in `locale` shows it: the locale's label (else the
 * source one), the locale's placeholder (else the source locale's) as
 * `placeholder`, a select's choices with their labels in that locale. The
 * maps themselves are dropped: they would only weigh down the island's props.
 * A field without any comes back with the same values.
 *
 * On the source locale `label` wins over a `labels` entry for it (a spec may
 * carry both): `label` is what the editors rename.
 */
export function localizeField<F extends CopyField>(field: F, locale: string, source: string): F {
  const { labels, placeholders, ...rest } = field;
  const label = locale === source ? undefined : pickLocaleText(labels, locale);
  const placeholder = pickLocaleText(placeholders, locale) ?? pickLocaleText(placeholders, source);
  return {
    ...rest,
    label: label ?? field.label,
    ...(placeholder ? { placeholder } : {}),
    ...(Array.isArray(field.options)
      ? { options: field.options.map((choice) => localizeChoice(choice, locale, source)) }
      : {}),
  } as F;
}
