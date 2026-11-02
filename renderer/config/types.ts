/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement, ReactNode } from 'react';
import type { CatalogEntry, Derived, ScopeDefField } from '../state/schema';

/* -------------------------------------------------------------------------- */
/*                                   FIELDS                                   */
/* -------------------------------------------------------------------------- */

/**
 * How a block prop is edited, as the registry describes it (`zodToField`).
 * The Design inspector reads these objects; the renderer owns the shape, and draws
 * nothing with it but the standalone editors in `default-fields.tsx`.
 *
 * A field's `label` is a KEY (the prop name, an option's raw value) that the
 * consumer translates — never copy.
 */
interface BaseField {
  label?: string;
  /** What a consumer reads without rendering (`hlKind`, `hlLiteral` …). */
  metadata?: Record<string, unknown>;
  /** `false` keeps the prop out of the inspector. */
  visible?: boolean;
}

export type SiteFieldOption = { label: string; value: string | number | boolean };

export interface TextField extends BaseField {
  type: 'text';
  placeholder?: string;
}

export interface TextareaField extends BaseField {
  type: 'textarea';
  placeholder?: string;
}

export interface NumberField extends BaseField {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface SelectField extends BaseField {
  type: 'select';
  options: SiteFieldOption[];
}

export interface RadioField extends BaseField {
  type: 'radio';
  options: SiteFieldOption[];
}

export interface ArrayField extends BaseField {
  type: 'array';
  arrayFields: Record<string, SiteField>;
  /** A new entry's props, or a function of how many there are. */
  defaultItemProps?: Record<string, unknown> | ((index: number) => Record<string, unknown>);
  getItemSummary?: (item: Record<string, unknown>, index?: number) => string;
  min?: number;
  max?: number;
}

export interface ObjectField extends BaseField {
  type: 'object';
  objectFields: Record<string, SiteField>;
}

/** A slot prop: its children are nodes of the document, never edited as a value. */
export interface SlotField extends BaseField {
  type: 'slot';
  /** Block types the slot takes; absent = every type not in `disallow`. */
  allow?: string[];
  disallow?: string[];
}

export interface CustomFieldDrawProps {
  field: CustomField;
  name: string;
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  /**
   * The parcours (scope) the edited node is in, or is — from the node's
   * ancestors, which no schema knows: the inspector computes it.
   */
  scope?: CustomFieldScope;
}

/**
 * What a field editor knows of the nearest scope: its fields,
 * steps and derived values as the runtime reads them (labels resolved), and
 * the currency amounts are counted in. `self` when the node IS the scope.
 */
export interface CustomFieldScope {
  fields: ScopeDefField[];
  steps: Array<{ id: string; label: string }>;
  derived: Derived[];
  currency: string | null;
  /** The records its collection-fed fields name: title and price (minor units). */
  catalog: Record<string, CatalogEntry>;
  self: boolean;
}

/** A prop the app draws itself (bound text, media, rich text …): `render` is the renderer's own. */
export interface CustomField extends BaseField {
  type: 'custom';
  render: (props: CustomFieldDrawProps) => ReactElement;
}

export type SiteField =
  | TextField
  | TextareaField
  | NumberField
  | SelectField
  | RadioField
  | ArrayField
  | ObjectField
  | SlotField
  | CustomField;

export type SiteFieldType = SiteField['type'];

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

/** A block's props as its render receives them: its own, `id`, `puck` (the render context). */
export type SiteBlockRenderProps = Record<string, unknown> & { id: string; puck?: unknown };

/** One block of the config: what the inspector reads, and what draws it. */
export interface SiteBlockConfig {
  /** A KEY (the block key); the Design editor translates it. */
  label?: string;
  fields?: Record<string, SiteField>;
  defaultProps?: Record<string, unknown>;
  render: (props: SiteBlockRenderProps) => ReactElement;
}

/**
 * The renderer's block config (`createSiteConfig`), generated from the
 * registry: the blocks by key, the palette's categories, and the root that
 * draws the scope boundary. `renderDoc` draws a document with it.
 */
export interface SiteRenderConfig {
  categories?: Record<string, { title?: string; components?: string[] }>;
  components: Record<string, SiteBlockConfig>;
  root?: {
    fields?: Record<string, SiteField>;
    render?: (props: { children: ReactNode; puck?: unknown }) => ReactElement;
  };
}
