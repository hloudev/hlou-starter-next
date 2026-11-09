/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type {
  CollectionDoc,
  CollectionQuery,
  ContentValue,
  FieldDoc,
  PageMeta,
  RecordDoc,
  ResolvedCollection,
  ResolvedForm,
  ResolvedMedia,
  ResolvedRecord,
  SiteLocaleInfo,
  SiteSnapshot,
} from '../contracts';
import type { DocNode, PageDocument } from '../doc/schema';
import { prefixHref } from './href';
import { applyQuery } from './query';

import { blockRegistry, isBlockKey } from '../blocks';
import {
  isCollectionRef,
  isFormRef,
  isMediaSize,
  isRecordRef,
  isResolvedMedia,
  isSlotRef,
  isStateRef,
  localizeField,
  withMediaRenditions,
} from '../contracts';
import { INSTANCE_NODE_TYPE } from '../doc/schema';
import { childrenOf, slotsOf } from '../doc/tree';

export { ariaCurrent, currentLink, prefixHref } from './href';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type ResolveMissing = {
  /** Slot ids referenced by a block with no value in any locale. Audit reads this. */
  slotIds: string[];
  collectionKeys: string[];
  formKeys: string[];
};

export type ResolveOptions = {
  /** Prefixed to hrefs derived from a `pageId` (e.g. `/fr`). Literal hrefs are untouched. */
  basePath?: string;
};

export type StaticPath = {
  locale: string;
  path: string;
  pageId: string;
  recordId?: string;
};

/** What resolution reads from a snapshot (`resolveDoc`, `resolveSlot`). */
export type ResolveSource = Pick<
  SiteSnapshot,
  'locales' | 'content' | 'media' | 'collections' | 'records' | 'forms'
> &
  Partial<Pick<SiteSnapshot, 'legacyPaths'>> & {
    /** `kind` and `collectionKey` give a record its link (`ResolvedRecord.href`). */
    pages: Array<Pick<PageMeta, 'id' | 'path'> & Partial<Pick<PageMeta, 'kind' | 'collectionKey'>>>;
  };

export type ResolveDocInput = ResolveOptions & {
  snapshot: ResolveSource;
  doc: PageDocument;
  locale: string;
  /** The current record on a `collection_template` page; leave unset for a component. */
  record?: RecordDoc;
};

export type ResolvedDoc = {
  doc: PageDocument;
  locale: string;
  dir: 'ltr' | 'rtl';
  missing: ResolveMissing;
};

type Context = {
  snapshot: ResolveSource;
  locale: string;
  source: string;
  basePath: string;
  /** The legacy layer's pages (`snapshot.legacyPaths`): their links stay unprefixed. */
  legacyPaths: ReadonlySet<string>;
  record: RecordDoc | undefined;
  missing: ResolveMissing;
};

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sourceLocale(snapshot: ResolveSource): SiteLocaleInfo {
  const source = snapshot.locales.find((locale) => locale.isSource) ?? snapshot.locales[0];
  if (!source) throw new Error('A site snapshot needs at least one locale');
  return source;
}

function localeInfo(snapshot: ResolveSource, code: string): SiteLocaleInfo {
  return snapshot.locales.find((locale) => locale.code === code) ?? sourceLocale(snapshot);
}

function pushUnique(list: string[], value: string) {
  if (!list.includes(value)) list.push(value);
}

function getAtPath(value: unknown, path: Array<string | number>): unknown {
  let current: unknown = value;
  for (const segment of path) {
    if (Array.isArray(current) && typeof segment === 'number') {
      current = current[segment];
    } else if (isRecord(current) && typeof segment === 'string') {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

function blockDefault(type: string, path: Array<string | number>): unknown {
  if (!isBlockKey(type)) return undefined;
  return getAtPath(blockRegistry[type].defaults, path);
}

function pickLocalized(value: unknown, ctx: Context): unknown {
  if (!isRecord(value)) return value;
  if (ctx.locale in value) return value[ctx.locale];
  if (ctx.source in value) return value[ctx.source];
  const first = Object.values(value)[0];
  return first;
}

function resolveMedia(assetId: unknown, ctx: Context): ResolvedMedia | null {
  if (typeof assetId !== 'string') return null;
  const asset = ctx.snapshot.media[assetId];
  if (!asset) return null;
  return {
    url: asset.url,
    width: asset.width,
    height: asset.height,
    alt: asset.alt[ctx.locale] ?? asset.alt[ctx.source] ?? '',
    mime: asset.mime,
    ...(asset.renditions ? { renditions: asset.renditions } : {}),
  };
}

/**
 * The served size a binding carries beside its reference (`{ $slot, size }`),
 * laid onto the media it resolved to. Anything else passes.
 */
function withBoundSize(literal: unknown, ref: Record<string, unknown>): unknown {
  if (!isMediaSize(ref.size) || !isResolvedMedia(literal)) return literal;
  return { ...literal, size: ref.size };
}

const HREF_KEY = /href/i;

function pageHref(pageId: string | undefined, ctx: Context): string | undefined {
  if (!pageId) return undefined;
  const page = ctx.snapshot.pages.find((candidate) => candidate.id === pageId);
  return page ? prefixHref(page.path, ctx.basePath) : undefined;
}

/** One navigation link as a block reads it: `href` wins, then the page, then `#`. */
function navigationLink(
  item: { label?: string; href?: string; pageId?: string },
  ctx: Context
): { label: string; href: string } {
  return {
    label: item.label ?? '',
    href: item.href
      ? prefixHref(item.href, ctx.basePath, ctx.legacyPaths)
      : (pageHref(item.pageId, ctx) ?? '#'),
  };
}

function contentToLiteral(value: ContentValue, ctx: Context): unknown {
  switch (value.kind) {
    case 'text':
    case 'heading':
      return value.text;
    case 'richtext':
      return value.doc;
    case 'media':
      return resolveMedia(value.assetId, ctx);
    case 'navigation':
      /* Always a LIST, even of one — a navigation slot is what a header's
         link list binds to, and a block wanting a single link reads the first
         entry. `href` wins; `pageId` is what a link authored against a page
         falls back to, so it follows the page when Structure moves it. */
      return value.items.map((item) => ({
        ...navigationLink(item, ctx),
        /* A dropdown's links resolve the same way. */
        ...(item.children?.length
          ? { children: item.children.map((child) => navigationLink(child, ctx)) }
          : {}),
      }));
    case 'dynamic':
      return value.collectionKey
        ? withQuery(resolveCollection(value.collectionKey, value.query, ctx), value.query)
        : null;
  }
}

function findContent(slotId: string, ctx: Context): ContentValue | undefined {
  return ctx.snapshot.content[ctx.locale]?.[slotId] ?? ctx.snapshot.content[ctx.source]?.[slotId];
}

/* ----------------------------- Collections -------------------------------- */

function resolveRecordDoc(
  record: RecordDoc,
  collection: CollectionDoc | undefined,
  ctx: Context
): ResolvedRecord {
  const data: Record<string, unknown> = {};
  const fieldsByKey = new Map<string, FieldDoc>(
    collection?.fields.map((field) => [field.key, field])
  );
  for (const [key, raw] of Object.entries(record.data)) {
    const field = fieldsByKey.get(key);
    let value = field?.localized ? pickLocalized(raw, ctx) : raw;
    if (field?.type === 'media') {
      value = Array.isArray(value)
        ? value.map((item) => resolveMedia(item, ctx)).filter((item) => item !== null)
        : resolveMedia(value, ctx);
    }
    data[key] = value;
  }
  return {
    id: record.id,
    slug: record.slug ?? null,
    data,
    publishedAt: record.publishedAt ?? null,
  };
}

/**
 * A record's own page (CB-h): the collection's template page with the slug
 * filled, under the base path. `undefined` with no template page, or for a
 * record with no slug — neither has a route to link to.
 */
function recordHref(collectionKey: string, slug: string | null | undefined, ctx: Context) {
  if (!slug) return undefined;
  const template = ctx.snapshot.pages.find(
    (page) => page.kind === 'collection_template' && page.collectionKey === collectionKey
  );
  if (!template) return undefined;
  return prefixHref(template.path.replace(/\[slug\]/g, encodeURIComponent(slug)), ctx.basePath);
}

/**
 * A resolved collection, plus the ref's `query`: the live list island (CB-04)
 * applies it again to the records it reads at runtime. Not part of the
 * contract's schema — nothing validates a resolved value — so it rides along.
 */
export type ResolvedCollectionWithQuery = ResolvedCollection & { query?: CollectionQuery };

function resolveCollection(
  key: string,
  query: CollectionQuery | undefined,
  ctx: Context
): ResolvedCollection {
  const collection = ctx.snapshot.collections.find((candidate) => candidate.key === key);
  if (!collection) pushUnique(ctx.missing.collectionKeys, key);
  const published = (ctx.snapshot.records[key] ?? []).filter(
    (record) => record.status === 'published'
  );
  const records = applyQuery(
    published.map((record) => {
      const resolved = resolveRecordDoc(record, collection, ctx);
      const href = recordHref(key, resolved.slug, ctx);
      return href ? { ...resolved, href } : resolved;
    }),
    query
  );
  return {
    $resolved: 'collection',
    collectionKey: key,
    delivery: collection?.delivery ?? 'static',
    fields: collection?.fields ?? [],
    records,
  };
}

/** The ref's `query` kept on its resolved collection, for the live list island. */
function withQuery(
  collection: ResolvedCollection,
  query: CollectionQuery | undefined
): ResolvedCollectionWithQuery {
  return query ? { ...collection, query } : collection;
}

function resolveForm(key: string, ctx: Context): ResolvedForm | undefined {
  const form = ctx.snapshot.forms.find((candidate) => candidate.key === key);
  if (!form) {
    pushUnique(ctx.missing.formKeys, key);
    return undefined;
  }
  const collection = ctx.snapshot.collections.find(
    (candidate) => candidate.key === form.collectionKey
  );
  const fieldsByKey = new Map<string, FieldDoc>(
    collection?.fields.map((field) => [field.key, field])
  );
  /* Each input as the page's locale reads it: label, placeholder, choice labels. */
  const fields = form.fieldKeys.flatMap((fieldKey) => {
    const field = fieldsByKey.get(fieldKey);
    return field ? [localizeField(field, ctx.locale, ctx.source)] : [];
  });
  return {
    $resolved: 'form',
    formKey: form.key,
    label: form.label,
    collectionKey: form.collectionKey,
    fields,
  };
}

function resolveRecordField(fieldKey: string, ctx: Context): unknown {
  if (!ctx.record) return undefined;
  const page = ctx.snapshot.collections.find((collection) =>
    (ctx.snapshot.records[collection.key] ?? []).some((record) => record.id === ctx.record?.id)
  );
  const resolved = resolveRecordDoc(ctx.record, page, ctx);
  if (fieldKey === 'slug') return resolved.slug ?? '';
  return resolved.data[fieldKey];
}

/* --------------------------------- Walk ----------------------------------- */

function resolveValue(
  value: unknown,
  type: string,
  path: Array<string | number>,
  ctx: Context
): unknown {
  /* A scope value has no content behind it: the render pass
     formats it from the scope's snapshot. It leaves here untouched. */
  if (isStateRef(value)) return value;
  if (isSlotRef(value)) {
    const content = findContent(value.$slot, ctx);
    const literal = content ? contentToLiteral(content, ctx) : undefined;
    if (literal !== undefined && literal !== null) return withBoundSize(literal, value);
    pushUnique(ctx.missing.slotIds, value.$slot);
    const fallback = blockDefault(type, path);
    return fallback === undefined ? value : fallback;
  }
  if (isRecordRef(value)) {
    const literal = resolveRecordField(value.$record, ctx);
    return literal === undefined ? value : withBoundSize(literal, value);
  }
  if (isCollectionRef(value)) {
    return withQuery(resolveCollection(value.$collection, value.query, ctx), value.query);
  }
  if (isFormRef(value)) {
    return resolveForm(value.$form, ctx) ?? value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => resolveValue(item, type, [...path, index], ctx));
  }
  if (isRecord(value)) {
    /* A media literal the editor wrote still names the session-gated route:
       its ready rungs come from `snapshot.media` (a rewritten snapshot's
       literals carry their own already). */
    const media = isResolvedMedia(value);
    const source = media ? withMediaRenditions(value, ctx.snapshot.media) : value;
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(source)) {
      /* A media value's rungs are final URLs, each `{ url, … }`: walked as
         media, every rung would get rungs of its own, and those theirs,
         without end (the Video block crashed the editor this way). */
      out[key] =
        media && key === 'renditions' ? item : resolveValue(item, type, [...path, key], ctx);
    }
    return out;
  }
  if (typeof value === 'string') {
    const key = path[path.length - 1];
    return typeof key === 'string' && HREF_KEY.test(key)
      ? prefixHref(value, ctx.basePath, ctx.legacyPaths)
      : value;
  }
  return value;
}

function createContext(
  input: ResolveOptions & { snapshot: ResolveSource; locale: string; record?: RecordDoc }
): Context {
  const locale = localeInfo(input.snapshot, input.locale);
  return {
    snapshot: input.snapshot,
    locale: locale.code,
    source: sourceLocale(input.snapshot).code,
    basePath: input.basePath ?? '',
    legacyPaths: new Set(input.snapshot.legacyPaths ?? []),
    record: input.record,
    missing: { slotIds: [], collectionKeys: [], formKeys: [] },
  };
}

const isLiveRecord = (record: RecordDoc) => (record.environment ?? 'production') === 'production';

/**
 * A collection's routable records, one per slug: published, with a slug, and
 * — when a Live and a Sandbox record share a slug, which only an unfiltered
 * snapshot holds — the Live one (CB-b). First-seen order is kept.
 */
function routableRecords(records: readonly RecordDoc[]): RecordDoc[] {
  const bySlug = new Map<string, RecordDoc>();
  for (const record of records) {
    if (record.status !== 'published' || !record.slug) continue;
    const held = bySlug.get(record.slug);
    if (!held || (!isLiveRecord(held) && isLiveRecord(record))) bySlug.set(record.slug, record);
  }
  return [...bySlug.values()];
}

function fillPath(path: string, record: RecordDoc | undefined): string {
  if (!record) return path;
  return path.replace(/\[slug\]/g, encodeURIComponent(record.slug ?? record.id));
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * An instance's overrides dereferenced like the props they replace:
 * bound values, record fields, hrefs under the base path. With no block type
 * at hand, a missing `$slot` keeps its reference rather than a default.
 */
function resolveOverrides(
  overrides: NonNullable<DocNode['overrides']>,
  ctx: Context
): NonNullable<DocNode['overrides']> {
  const out: NonNullable<DocNode['overrides']> = {};
  for (const [id, override] of Object.entries(overrides)) {
    const resolved: Record<string, unknown> = { ...override };
    for (const part of ['props', 'style'] as const) {
      const value = override[part];
      if (isRecord(value)) resolved[part] = resolveValue(value, INSTANCE_NODE_TYPE, [], ctx);
    }
    out[id] = resolved;
  }
  return out;
}

/**
 * A document dereferenced for one locale, node by node: `{ $slot }` → the
 * locale's content (the source locale, then the node's OWN block default at
 * its own path, nested or not), `{ $collection }` → published records
 * after `query`, `{ $form }` → the form and its fields, `{ $record }` → the
 * current record's field on a template page. `rootProps` is left as is. Pure.
 */
export function resolveDoc(input: ResolveDocInput): ResolvedDoc {
  const ctx = createContext(input);
  const { doc } = input;
  const nodes: Record<string, DocNode> = {};
  const visit = (parentId: string) => {
    for (const slot of slotsOf(doc, parentId)) {
      for (const node of childrenOf(doc, parentId, slot)) {
        const props: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(node.props)) {
          props[key] = resolveValue(value, node.type, [key], ctx);
        }
        nodes[node.id] = { ...node, props };
        if (node.type === INSTANCE_NODE_TYPE && node.overrides) {
          nodes[node.id] = { ...node, props, overrides: resolveOverrides(node.overrides, ctx) };
        }
        visit(node.id);
      }
    }
  };
  const root = doc.nodes[doc.root];
  if (root) {
    nodes[root.id] = root;
    visit(root.id);
  }
  return {
    doc: { ...doc, nodes },
    locale: ctx.locale,
    dir: localeInfo(input.snapshot, ctx.locale).dir,
    missing: ctx.missing,
  };
}

/**
 * One slot dereferenced for one locale (the source as fallback), as the
 * literal a bound prop draws — what Detach keeps on the block. `undefined`
 * when the slot has no value in either.
 */
export function resolveSlot(
  input: ResolveOptions & { snapshot: ResolveSource; slotId: string; locale: string }
): unknown {
  const ctx = createContext(input);
  const content = findContent(input.slotId, ctx);
  const literal = content ? contentToLiteral(content, ctx) : undefined;
  return literal ?? undefined;
}

/**
 * One collection resolved for a locale exactly as a `{ $collection }` ref is
 * on a page — localized fields picked, media resolved against `snapshot.media`,
 * `href` from the template page under `basePath` — then `query`. What the
 * public records endpoint answers with (series CB, CB-04), so a live list
 * draws its runtime records the way it drew its frozen ones.
 */
export function resolveCollectionRecords(
  input: ResolveOptions & {
    snapshot: ResolveSource;
    locale: string;
    collectionKey: string;
    query?: CollectionQuery;
  }
): ResolvedCollection {
  return resolveCollection(input.collectionKey, input.query, createContext(input));
}

/**
 * Every path the static export must produce: each page × each locale, and one
 * per published record for template pages. Drafts are skipped unless asked.
 * A path is listed once: the first page to claim it wins, and a slug shared
 * by a Live and a Sandbox record is the Live one's.
 */
export function listStaticPaths(
  snapshot: Pick<SiteSnapshot, 'locales' | 'records'> & { pages: PageMeta[] },
  options: { includeDrafts?: boolean } = {}
): StaticPath[] {
  const paths: StaticPath[] = [];
  const seen = new Set<string>();
  const push = (entry: StaticPath) => {
    const key = `${entry.locale}\u0000${entry.path}`;
    if (seen.has(key)) return;
    seen.add(key);
    paths.push(entry);
  };
  for (const locale of snapshot.locales) {
    for (const page of snapshot.pages) {
      if (page.status === 'draft' && !options.includeDrafts) continue;
      if (page.kind === 'collection_template') {
        const records = page.collectionKey ? (snapshot.records[page.collectionKey] ?? []) : [];
        for (const record of routableRecords(records)) {
          push({
            locale: locale.code,
            path: fillPath(page.path, record),
            pageId: page.id,
            recordId: record.id,
          });
        }
        continue;
      }
      push({ locale: locale.code, path: page.path, pageId: page.id });
    }
  }
  return paths;
}

/**
 * Locate the record a template path segment names; `undefined` when none.
 * The Live record when a Sandbox one shares its slug (CB-b).
 */
export function findRecordBySlug(
  snapshot: Pick<SiteSnapshot, 'records'>,
  collectionKey: string,
  slug: string
): RecordDoc | undefined {
  const matches = (snapshot.records[collectionKey] ?? []).filter(
    (record) => record.status === 'published' && record.slug === slug
  );
  return matches.find(isLiveRecord) ?? matches[0];
}
