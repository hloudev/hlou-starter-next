/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { BoundMeta, ResolvedForm } from '../../contracts';

import { boundSchema, floatingSlotSchema, formSourceSchema, longTextSchema } from '../../contracts';
import { styleProps } from '../style-props';

/** What a click on the canvas can pick inside a form block — each styleable. */
export const FORM_ELEMENTS = ['title', 'description', 'form', 'submit'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/**
 * A form field filled from its scope at submit (M40-16): `field` a field key
 * of the form's collection, `path` a scope path (a value or a derived one),
 * `as: 'text'` formatted as the page shows it. The field draws no input.
 */
export const fromStateEntrySchema = z.object({
  field: z.string(),
  path: z.string().meta({ hl: 'statePath' } satisfies BoundMeta),
  as: z.enum(['value', 'text']).optional(),
});

export const formSchema = z.object({
  source: formSourceSchema.nullable(),
  title: boundSchema(z.string()),
  description: boundSchema(longTextSchema),
  submitLabel: boundSchema(z.string()),
  successMessage: boundSchema(longTextSchema),
  /** Network and server failures only: each field words its own error. */
  errorMessage: boundSchema(longTextSchema),
  /** Inside a scope: fields posted from the scope's values. Ignored outside one. */
  fromState: z.array(fromStateEntrySchema).max(16).optional(),
  /** Inside a scope: no submit button — a scope button (`{ do: 'submit' }`) sends it. */
  hideSubmit: z.boolean().optional(),
  ...styleProps(FORM_ELEMENTS),
  /** Free elements drawn over the form block (`floating` blocks). */
  floating: floatingSlotSchema,
});
export type FormStoredProps = z.infer<typeof formSchema>;
export type FormProps = Omit<FormStoredProps, 'source'> & {
  source: FormStoredProps['source'] | ResolvedForm;
};
