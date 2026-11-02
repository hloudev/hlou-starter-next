/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { CustomFieldRenderers, CustomFieldRenderProps } from './fields';

import { isCollectionRef, isFormRef, isRecordRef, isSlotRef } from '../contracts';
import { richTextToPlain } from '../richtext';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Standalone renderers: plain inputs, no hooks, no app dependency. The Hlou
 * app replaces them through `fieldOverrides` with its Mantine inspector; they
 * exist so the package works on its own (the starter, a bare Puck editor).
 */

function Wrap({
  id,
  label,
  children,
}: {
  id: string;
  label?: string;
  children: ReactElement | ReactElement[];
}): ReactElement {
  return (
    <div data-hl-field={id}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      {children}
    </div>
  );
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readNumber(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

function parseJson(text: string): unknown | undefined {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function plainToDoc(text: string): unknown {
  return {
    type: 'doc',
    content: text
      .split(/\n{2,}/)
      .filter((paragraph) => paragraph.length > 0)
      .map((paragraph) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: paragraph }],
      })),
  };
}

function LiteralInput({ id, value, onChange, readOnly }: CustomFieldRenderProps): ReactElement {
  if (typeof value === 'number') {
    return (
      <input
        id={id}
        type="number"
        value={readNumber(value)}
        readOnly={readOnly}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    );
  }
  if (typeof value === 'boolean') {
    return (
      <input
        id={id}
        type="checkbox"
        checked={value}
        disabled={readOnly}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    );
  }
  if (typeof value === 'string') {
    return (
      <input
        id={id}
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    );
  }
  return (
    <textarea
      id={id}
      defaultValue={JSON.stringify(value ?? null, null, 2)}
      readOnly={readOnly}
      onChange={(event) => {
        const parsed = parseJson(event.currentTarget.value);
        if (parsed !== undefined) onChange(parsed);
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                 RENDERERS                                  */
/* -------------------------------------------------------------------------- */

function SlotRefField(props: CustomFieldRenderProps): ReactElement {
  const { id, label, value, onChange, readOnly } = props;
  if (isSlotRef(value) || isRecordRef(value)) {
    const key = isSlotRef(value) ? '$slot' : '$record';
    const current = isSlotRef(value) ? value.$slot : value.$record;
    return (
      <Wrap id={id} label={label}>
        <input
          id={id}
          type="text"
          value={current}
          readOnly={readOnly}
          placeholder={key}
          onChange={(event) => onChange({ [key]: event.currentTarget.value })}
        />
        <button type="button" disabled={readOnly} onClick={() => onChange('')}>
          ⨯
        </button>
      </Wrap>
    );
  }
  return (
    <Wrap id={id} label={label}>
      <LiteralInput {...props} />
      <button type="button" disabled={readOnly} onClick={() => onChange({ $slot: '' })}>
        $slot
      </button>
    </Wrap>
  );
}

function CollectionRefField({
  id,
  label,
  value,
  onChange,
  readOnly,
}: CustomFieldRenderProps): ReactElement {
  const ref = isCollectionRef(value) ? value : null;
  return (
    <Wrap id={id} label={label}>
      <input
        id={id}
        type="text"
        value={ref?.$collection ?? ''}
        readOnly={readOnly}
        placeholder="$collection"
        onChange={(event) => {
          const key = event.currentTarget.value;
          onChange(key ? { $collection: key, query: ref?.query } : null);
        }}
      />
      <textarea
        id={`${id}-query`}
        defaultValue={JSON.stringify(ref?.query ?? {}, null, 2)}
        readOnly={readOnly || !ref}
        onChange={(event) => {
          const parsed = parseJson(event.currentTarget.value);
          if (ref && parsed !== undefined && typeof parsed === 'object') {
            onChange({ $collection: ref.$collection, query: parsed });
          }
        }}
      />
    </Wrap>
  );
}

function FormRefField({
  id,
  label,
  value,
  onChange,
  readOnly,
}: CustomFieldRenderProps): ReactElement {
  return (
    <Wrap id={id} label={label}>
      <input
        id={id}
        type="text"
        value={isFormRef(value) ? value.$form : ''}
        readOnly={readOnly}
        placeholder="$form"
        onChange={(event) => {
          const key = event.currentTarget.value;
          onChange(key ? { $form: key } : null);
        }}
      />
    </Wrap>
  );
}

/** A field key of the bound collection, typed: the app draws a select of its fields. */
function CollectionFieldField({
  id,
  label,
  value,
  onChange,
  readOnly,
}: CustomFieldRenderProps): ReactElement {
  return (
    <Wrap id={id} label={label}>
      <input
        id={id}
        type="text"
        value={readString(value)}
        readOnly={readOnly}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </Wrap>
  );
}

function RichTextField({
  id,
  label,
  value,
  onChange,
  readOnly,
}: CustomFieldRenderProps): ReactElement {
  return (
    <Wrap id={id} label={label}>
      <textarea
        id={id}
        defaultValue={richTextToPlain(value)}
        readOnly={readOnly}
        onChange={(event) => onChange(plainToDoc(event.currentTarget.value))}
      />
    </Wrap>
  );
}

function MediaField({
  id,
  label,
  value,
  onChange,
  readOnly,
}: CustomFieldRenderProps): ReactElement {
  const media =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const update = (patch: Record<string, unknown>) => {
    const next = { ...media, ...patch };
    onChange(typeof next.url === 'string' && next.url ? next : null);
  };
  return (
    <Wrap id={id} label={label}>
      <input
        id={id}
        type="url"
        value={readString(media.url)}
        readOnly={readOnly}
        placeholder="https://"
        onChange={(event) => update({ url: event.currentTarget.value })}
      />
      <input
        id={`${id}-alt`}
        type="text"
        value={readString(media.alt)}
        readOnly={readOnly}
        placeholder="alt"
        onChange={(event) => update({ alt: event.currentTarget.value })}
      />
    </Wrap>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
  readOnly,
}: CustomFieldRenderProps): ReactElement {
  const record =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const isCustom = typeof record.custom === 'string';
  return (
    <Wrap id={id} label={label}>
      <input
        id={id}
        type="text"
        value={isCustom ? readString(record.custom) : readString(record.role)}
        readOnly={readOnly}
        placeholder="role, or a #hex for a custom colour"
        onChange={(event) => {
          const next = event.currentTarget.value;
          onChange(next.startsWith('#') ? { custom: next } : { role: next });
        }}
      />
    </Wrap>
  );
}

function FontField({ id, label, value, onChange, readOnly }: CustomFieldRenderProps): ReactElement {
  const record =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const isCustom = typeof record.family === 'string';
  return (
    <Wrap id={id} label={label}>
      <input
        id={id}
        type="text"
        value={isCustom ? readString(record.family) : readString(record.role)}
        readOnly={readOnly}
        placeholder="role, or a font family name"
        onChange={(event) => {
          const next = event.currentTarget.value;
          onChange(isCustom || !next ? { family: next, source: 'google' } : { role: next });
        }}
      />
    </Wrap>
  );
}

function JsonField({ id, label, value, onChange, readOnly }: CustomFieldRenderProps): ReactElement {
  return (
    <Wrap id={id} label={label}>
      <textarea
        id={id}
        defaultValue={JSON.stringify(value ?? null, null, 2)}
        readOnly={readOnly}
        onChange={(event) => {
          const parsed = parseJson(event.currentTarget.value);
          if (parsed !== undefined) onChange(parsed);
        }}
      />
    </Wrap>
  );
}

/** A path into the nearest scope, typed as text: the Design inspector picks it from the scope. */
function StatePathField({ id, label, value, onChange, readOnly }: CustomFieldRenderProps) {
  return (
    <Wrap id={id} label={label}>
      <input
        id={id}
        type="text"
        value={typeof value === 'string' ? value : ''}
        readOnly={readOnly}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </Wrap>
  );
}

export const defaultFieldRenderers: CustomFieldRenderers = {
  slotRef: SlotRefField,
  collectionRef: CollectionRefField,
  formRef: FormRefField,
  collectionField: CollectionFieldField,
  richtext: RichTextField,
  media: MediaField,
  json: JsonField,
  color: ColorField,
  font: FontField,
  /* A breakpoint map and a free position are structured values with no
     plain-input shape worth building here; the Design inspector overrides
     both. Standalone, they edit as JSON. */
  responsive: JsonField,
  position: JsonField,
  style: JsonField,
  elements: JsonField,
  /* A scope's lists and a button's action are edited as JSON
     here; the Design inspector draws their own editors. */
  scopeFields: JsonField,
  scopeSteps: JsonField,
  scopeDerived: JsonField,
  action: JsonField,
  statePath: StatePathField,
};
