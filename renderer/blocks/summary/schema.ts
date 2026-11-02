/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundMediaSchema, boundSchema, stateRefSchema } from '../../contracts';
import { whenSchema } from '../../state/condition';
import { statePathSchema } from '../quantity/schema';
import { styleProps } from '../style-props';

/** What a click on the canvas can pick inside the summary — each styleable. */
export const SUMMARY_ELEMENTS = ['title', 'rows', 'total'] as const;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

/** R1's formats (`{ $state, format }`): how a row prints its value. */
export const stateFormatSchema = stateRefSchema.shape.format.unwrap();

/**
 * A count and its unit word, picked with `Intl.PluralRules`: « 3 nuits ».
 * Structured, not a template — no expression language.
 */
export const summaryPluralSchema = z.object({
  path: statePathSchema,
  one: boundSchema(z.string()),
  other: boundSchema(z.string()),
});
export type SummaryPlural = z.infer<typeof summaryPluralSchema>;

export const summaryRowSchema = z.object({
  label: boundSchema(z.string()),
  /** Joined by « × »: « 1 tente × 3 nuits ». */
  detail: z.array(summaryPluralSchema).max(3),
  value: z.object({ path: statePathSchema, format: stateFormatSchema }),
  /** Shown only while this holds (`payment eq deposit`). */
  when: whenSchema.optional(),
  tone: z.enum(['normal', 'muted', 'strong']),
});
export type SummaryRow = z.infer<typeof summaryRowSchema>;

/**
 * The summary: « Votre réservation » beside a wizard — rows read
 * from the nearest scope, a derived `lines` value's items, a total always
 * labelled « Estimation », and rows under it (the deposit). Sticky from
 * 1024 px (it aligns itself to the start of its grid cell); on a phone a
 * bottom bar that opens the card.
 */
export const summarySchema = z.object({
  title: boundSchema(z.string()),
  media: boundMediaSchema().nullable().optional(),
  rows: z.array(summaryRowSchema).max(8),
  /** A `lines` derived key; `one` / `other` are the unit words (« personne »). */
  lines: summaryPluralSchema.nullable(),
  total: z.object({ label: boundSchema(z.string()), path: statePathSchema }).nullable(),
  /** Under the total: « Acompte à régler (50 %) ». */
  after: z.array(summaryRowSchema).max(3),
  sticky: z.boolean(),
  /** Under 768 px: the card where it sits, or a bottom bar that opens it. */
  mobile: z.enum(['card', 'bar']),
  ...styleProps(SUMMARY_ELEMENTS),
});
export type SummaryProps = z.infer<typeof summarySchema>;
