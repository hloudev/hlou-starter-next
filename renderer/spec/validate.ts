/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { z } from 'zod';
import type { SiteSpecLock } from './lock';
import type {
  SiteSpecCollection,
  SiteSpecContent,
  SiteSpecPage,
  SiteSpecSite,
  SpecDocument,
  SpecSlot,
} from './schema';
import { withBlockDefaults } from './block-props';
import { siteSpecLockSchema } from './lock';
import {
  isSiteSpecMediaPath,
  parseSiteSpecContentKey,
  parseSiteSpecPath,
  SITE_SPEC_LOCK_PATH,
  SITE_SPEC_ROOT,
  SITE_SPEC_SITE_PATH,
  SITE_SPEC_SITE_SCOPE,
  siteSpecMediaFile,
} from './paths';
import {
  DUPLICATE_KEY_CODE,
  siteSpecCollectionSchema,
  siteSpecContentSchema,
  siteSpecPageSchema,
  siteSpecSiteSchema,
  specCollectionKeySchema,
  specLocaleSchema,
  specPageSlugSchema,
} from './schema';

import { blockRegistry, isBlockKey } from '../blocks';
import { INSTANCE_NODE_TYPE, ROOT_NODE_TYPE } from '../doc/schema';
import { slotPropsOfType } from '../doc/slots';
import { assertDocShape } from '../doc/tree';

/* -------------------------------------------------------------------------- */
/*                                    CODES                                   */
/* -------------------------------------------------------------------------- */

/**
 * What `validateSiteSpec` reports. Stable: the import report and the MCP
 * translate a code, never the English message.
 */
export const SITE_SPEC_ERROR_CODES = [
  /** The file is not JSON. */
  'json_invalid',
  /** A file under `hlou/site/` the format does not define. */
  'file_unknown',
  /** `hlou/site/site.json` is missing. */
  'file_missing',
  /** The slug, locale or key in a file's name breaks its grammar. */
  'file_name_invalid',
  /** A value of the wrong shape or type. */
  'schema_invalid',
  /** A key the format does not know, at any depth. */
  'unknown_key',
  /** A key (or a page path, a form key) used twice in its scope. */
  'key_duplicate',
  /** A page, section, component, collection, form or record named and not defined. */
  'reference_unknown',
  /** A page whose parents lead back to it. */
  'parent_cycle',
  /** A document node whose type is not a block key, `root` or `instance`. */
  'block_unknown',
  /** A node's props fail its block's schema, or name a prop it does not have. */
  'block_props_invalid',
  /** A document that is not one tree from its root. */
  'document_invalid',
  /** A `{ "$slot" }` naming a slot the page (or the site) does not declare. */
  'slot_undeclared',
  /** A content value for a slot that does not exist. */
  'content_slot_unknown',
  /** A content value whose kind is not its slot's. */
  'content_kind_mismatch',
  /** A locale the site does not list. */
  'locale_unknown',
  /**
   * The source locale listed as disabled. Content for a disabled locale is
   * valid: the locale keeps it while it is off.
   */
  'locale_disabled',
  /**
   * A block's custom font (`{ family, source: 'custom' }`) with no custom face
   * of that family in `site.json`'s theme fonts, which carries its file.
   */
  'font_unknown',
  /** A media path with no file under `public/media/`. */
  'media_missing',
  /** Records in a website-writable collection (they are visitor submissions). */
  'records_not_allowed',
  /** A record value, `$record` or form mapping naming a field the collection lacks. */
  'field_unknown',
] as const;
export type SiteSpecErrorCode = (typeof SITE_SPEC_ERROR_CODES)[number];

export interface SiteSpecError {
  /** The file, relative to the starter's root (`hlou/site/pages/home.json`). */
  file: string;
  /** Inside the file's JSON; `[]` is the file itself. */
  path: Array<string | number>;
  code: SiteSpecErrorCode;
  /** English, for a person or an agent; the UI translates `code` instead. */
  message: string;
}

/** A spec that validated, parsed. */
export interface SiteSpec {
  site: SiteSpecSite;
  pages: Record<string, SiteSpecPage>;
  content: Record<string, SiteSpecContent>;
  collections: Record<string, SiteSpecCollection>;
  lock: SiteSpecLock | null;
}

export type SiteSpecValidation =
  { ok: true; errors: []; spec: SiteSpec } | { ok: false; errors: SiteSpecError[]; spec: null };

/**
 * The starter's files, by path relative to its root. A spec file's value is
 * its text, or its already-parsed JSON; a media file's value is ignored (its
 * presence is what counts). Paths outside `hlou/` and `public/media/` are
 * ignored.
 */
export type SiteSpecFiles = Readonly<Record<string, unknown>>;

/* -------------------------------------------------------------------------- */
/*                                  VALIDATE                                  */
/* -------------------------------------------------------------------------- */

type Path = Array<string | number>;

class Report {
  readonly errors: SiteSpecError[] = [];
  add(file: string, path: Path, code: SiteSpecErrorCode, message: string) {
    this.errors.push({ file, path, code, message });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readJson(report: Report, file: string, raw: unknown): { ok: boolean; value: unknown } {
  if (typeof raw !== 'string') return { ok: true, value: raw };
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch (error) {
    report.add(file, [], 'json_invalid', error instanceof Error ? error.message : 'Not JSON');
    return { ok: false, value: null };
  }
}

/** Zod's issues as spec errors: strictness, the `superRefine` codes, the rest. */
function reportIssues(report: Report, file: string, issues: readonly z.core.$ZodIssue[]) {
  for (const issue of issues) {
    const path = issue.path.map((part) => (typeof part === 'symbol' ? String(part) : part));
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) {
        report.add(file, [...path, key], 'unknown_key', `Unknown key "${key}"`);
      }
      continue;
    }
    const code =
      issue.code === 'custom' && issue.params?.code === DUPLICATE_KEY_CODE
        ? 'key_duplicate'
        : 'schema_invalid';
    report.add(file, path, code, issue.message);
  }
}

function parseWith<T>(
  report: Report,
  file: string,
  schema: z.ZodType<T>,
  value: unknown
): T | null {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  reportIssues(report, file, parsed.error.issues);
  return null;
}

/**
 * Checks a site spec, file by file and across files, and says what is wrong
 * in terms a person or an agent can act on: the file, the JSON path inside
 * it, a stable code and an English message. Pure: no filesystem, no network.
 *
 * `ok` only when there is no error at all; the parsed spec comes with it.
 */
export function validateSiteSpec(files: SiteSpecFiles): SiteSpecValidation {
  const report = new Report();
  let site: SiteSpecSite | null = null;
  let siteSeen = false;
  let lock: SiteSpecLock | null = null;
  const pages: Record<string, SiteSpecPage> = {};
  const content: Record<string, SiteSpecContent> = {};
  const collections: Record<string, SiteSpecCollection> = {};
  /** Files that did not parse: their cross-file checks are skipped, not guessed. */
  let incomplete = false;

  for (const file of Object.keys(files).sort()) {
    if (file !== SITE_SPEC_LOCK_PATH && !file.startsWith(`${SITE_SPEC_ROOT}/`)) continue;
    const ref = parseSiteSpecPath(file);
    if (!ref) {
      report.add(
        file,
        [],
        'file_unknown',
        `Not a site spec file: the spec is site.json, pages/<slug>.json, content/<locale>.json and collections/<key>.json under ${SITE_SPEC_ROOT}/`
      );
      continue;
    }
    const json = readJson(report, file, files[file]);
    if (!json.ok) {
      incomplete = true;
      continue;
    }
    switch (ref.kind) {
      case 'lock':
        lock = parseWith(report, file, siteSpecLockSchema, json.value);
        break;
      case 'site':
        siteSeen = true;
        site = parseWith(report, file, siteSpecSiteSchema, json.value);
        if (!site) incomplete = true;
        break;
      case 'page': {
        if (!fileName(report, file, specPageSlugSchema, ref.slug)) continue;
        const page = parseWith(report, file, siteSpecPageSchema, json.value);
        if (page) pages[ref.slug] = page;
        else incomplete = true;
        break;
      }
      case 'content': {
        if (!fileName(report, file, specLocaleSchema, ref.locale)) continue;
        const values = parseWith(report, file, siteSpecContentSchema, json.value);
        if (values) content[ref.locale] = values;
        else incomplete = true;
        break;
      }
      case 'collection': {
        if (!fileName(report, file, specCollectionKeySchema, ref.key)) continue;
        const collection = parseWith(report, file, siteSpecCollectionSchema, json.value);
        if (collection) collections[ref.key] = collection;
        else incomplete = true;
        break;
      }
    }
  }

  if (!siteSeen) {
    report.add(SITE_SPEC_SITE_PATH, [], 'file_missing', 'The spec has no site.json');
  }

  const parsed = { site, pages, content, collections, lock };
  if (site) checkAcrossFiles(report, { ...parsed, site }, files, incomplete);

  if (report.errors.length > 0) return { ok: false, errors: report.errors, spec: null };
  if (!site) return { ok: false, errors: report.errors, spec: null };
  return { ok: true, errors: [], spec: { ...parsed, site } };
}

function fileName(report: Report, file: string, schema: z.ZodType, name: string): boolean {
  const parsed = schema.safeParse(name);
  if (parsed.success) return true;
  report.add(
    file,
    [],
    'file_name_invalid',
    `"${name}" in the file name: ${parsed.error.issues[0]?.message ?? 'invalid'}`
  );
  return false;
}

/* -------------------------------------------------------------------------- */
/*                                ACROSS FILES                                */
/* -------------------------------------------------------------------------- */

interface Context {
  report: Report;
  spec: SiteSpec;
  files: SiteSpecFiles;
  /** Site slots by key. */
  siteSlots: Map<string, SpecSlot>;
  /** Each page's slots (page-level and section) by key. */
  pageSlots: Map<string, Map<string, SpecSlot>>;
  /** Every form key → its collection. */
  forms: Map<string, string>;
  components: Set<string>;
  /** The families of the theme's custom faces, roles and locale overrides alike. */
  customFonts: Set<string>;
  /** False when a file did not parse: a dangling name may be in it. */
  complete: boolean;
}

function checkAcrossFiles(
  report: Report,
  spec: SiteSpec,
  files: SiteSpecFiles,
  incomplete: boolean
) {
  const siteSlots = new Map((spec.site.slots ?? []).map((slot) => [slot.key, slot] as const));
  const pageSlots = new Map<string, Map<string, SpecSlot>>();
  for (const [slug, page] of Object.entries(spec.pages)) {
    const slots = new Map<string, SpecSlot>();
    for (const slot of page.slots ?? []) slots.set(slot.key, slot);
    for (const section of page.sections)
      for (const slot of section.slots) slots.set(slot.key, slot);
    pageSlots.set(slug, slots);
  }
  const forms = new Map<string, string>();
  for (const [key, collection] of Object.entries(spec.collections)) {
    for (const form of collection.forms ?? []) {
      if (!forms.has(form.key)) forms.set(form.key, key);
    }
  }
  const ctx: Context = {
    report,
    spec,
    files,
    siteSlots,
    pageSlots,
    forms,
    components: new Set((spec.site.components ?? []).map((component) => component.key)),
    customFonts: new Set(
      spec.site.theme.fonts
        .flatMap((role) => [role, ...Object.values(role.localeOverrides ?? {})])
        .filter((face) => face.source === 'custom')
        .map((face) => face.family)
    ),
    complete: !incomplete,
  };

  checkSite(ctx);
  checkPages(ctx);
  checkContent(ctx);
  checkCollections(ctx);
  checkMedia(ctx);
}

/** A name that should resolve; silent while a file failed to parse, since it may live there. */
function unknown(ctx: Context, file: string, path: Path, message: string) {
  if (ctx.complete) ctx.report.add(file, path, 'reference_unknown', message);
}

function checkSite(ctx: Context) {
  const { site } = ctx.spec;
  const file = SITE_SPEC_SITE_PATH;
  const source = site.locales.find((locale) => locale.code === site.project.sourceLocale);
  if (!source) {
    ctx.report.add(
      file,
      ['project', 'sourceLocale'],
      'locale_unknown',
      `The source locale "${site.project.sourceLocale}" is not in locales`
    );
  } else if (source.enabled === false) {
    ctx.report.add(
      file,
      ['project', 'sourceLocale'],
      'locale_disabled',
      'The source locale cannot be disabled'
    );
  }
  for (const [index, slot] of (site.slots ?? []).entries()) {
    checkSlotCollection(ctx, file, ['slots', index], slot);
  }
  for (const [index, component] of (site.components ?? []).entries()) {
    checkDocument(ctx, file, ['components', index, 'document'], component.document, null);
  }
}

function checkSlotCollection(ctx: Context, file: string, path: Path, slot: SpecSlot) {
  if (slot.collection && !ctx.spec.collections[slot.collection]) {
    unknown(ctx, file, [...path, 'collection'], `No collection "${slot.collection}"`);
  }
}

function checkPages(ctx: Context) {
  const { pages } = ctx.spec;
  const paths = new Map<string, string>();
  for (const slug of Object.keys(pages).sort()) {
    const page = pages[slug] as SiteSpecPage;
    const file = `${SITE_SPEC_ROOT}/pages/${slug}.json`;

    const taken = paths.get(page.path);
    if (taken) {
      ctx.report.add(
        file,
        ['path'],
        'key_duplicate',
        `The path "${page.path}" is also page "${taken}"’s`
      );
    } else {
      paths.set(page.path, slug);
    }

    if (page.parent) {
      if (!pages[page.parent]) unknown(ctx, file, ['parent'], `No page "${page.parent}"`);
      else if (leadsBack(pages, slug)) {
        ctx.report.add(file, ['parent'], 'parent_cycle', `Page "${slug}" is its own ancestor`);
      }
    }
    if (page.collection && !ctx.spec.collections[page.collection]) {
      unknown(ctx, file, ['collection'], `No collection "${page.collection}"`);
    }
    for (const [index, slot] of (page.slots ?? []).entries()) {
      checkSlotCollection(ctx, file, ['slots', index], slot);
    }
    for (const [index, section] of page.sections.entries()) {
      for (const [at, slot] of section.slots.entries()) {
        checkSlotCollection(ctx, file, ['sections', index, 'slots', at], slot);
      }
    }
    if (page.document) checkDocument(ctx, file, ['document'], page.document, slug);
  }
}

function leadsBack(pages: Record<string, SiteSpecPage>, slug: string): boolean {
  const seen = new Set<string>([slug]);
  let parent = pages[slug]?.parent ?? null;
  while (parent) {
    if (seen.has(parent)) return parent === slug;
    seen.add(parent);
    parent = pages[parent]?.parent ?? null;
  }
  return false;
}

/**
 * One document: its tree, each node's type and props, and every name inside
 * the props. `slug` is the page's, null for a site component (which sees only
 * site slots).
 */
function checkDocument(
  ctx: Context,
  file: string,
  at: Path,
  doc: SpecDocument,
  slug: string | null
) {
  try {
    assertDocShape(doc);
  } catch (error) {
    ctx.report.add(
      file,
      at,
      'document_invalid',
      error instanceof Error ? error.message : 'Not one tree'
    );
  }
  const page = slug ? ctx.spec.pages[slug] : undefined;
  const sections = new Set((page?.sections ?? []).map((section) => section.key));

  for (const [id, node] of Object.entries(doc.nodes)) {
    const path: Path = [...at, 'nodes', id];
    if (node.section !== undefined && !sections.has(node.section)) {
      ctx.report.add(
        file,
        [...path, 'section'],
        'reference_unknown',
        slug
          ? `Page "${slug}" has no section "${node.section}"`
          : 'A component’s node cannot be a page section'
      );
    }
    if (node.type === ROOT_NODE_TYPE) continue;
    if (node.type === INSTANCE_NODE_TYPE) {
      if (!node.instanceOf) {
        ctx.report.add(file, path, 'schema_invalid', 'An instance names its component');
      } else if (!ctx.components.has(node.instanceOf)) {
        ctx.report.add(
          file,
          [...path, 'instanceOf'],
          'reference_unknown',
          `No component "${node.instanceOf}"`
        );
      }
      continue;
    }
    if (!isBlockKey(node.type)) {
      ctx.report.add(file, [...path, 'type'], 'block_unknown', `Unknown block "${node.type}"`);
      continue;
    }
    checkBlockProps(ctx, file, [...path, 'props'], node.type, node.props);
    walkRefs(ctx, file, [...path, 'props'], node.props, slug);
  }
}

/** The block's own schema over its defaults and these props, slots empty (as the service checks). */
function checkBlockProps(
  ctx: Context,
  file: string,
  path: Path,
  type: keyof typeof blockRegistry,
  props: Record<string, unknown>
) {
  const definition = blockRegistry[type];
  const slots = slotPropsOfType(type);
  const known = Object.keys(definition.schema.shape);
  for (const key of Object.keys(props)) {
    if (!known.includes(key)) {
      ctx.report.add(
        file,
        [...path, key],
        'block_props_invalid',
        `${type} has no prop "${key}" — its props are: ${known.join(', ')}`
      );
    }
  }
  /* The compiler writes these same props (`withBlockDefaults`). */
  const candidate = { ...withBlockDefaults(type, props) };
  for (const slot of slots.keys()) candidate[slot] = [];
  const parsed = definition.schema.safeParse(candidate);
  if (parsed.success) return;
  for (const issue of parsed.error.issues) {
    const sub = issue.path.map((part) => (typeof part === 'symbol' ? String(part) : part));
    if (sub.length > 0 && !(String(sub[0]) in props)) continue; // a default's problem, not the file's
    ctx.report.add(file, [...path, ...sub], 'block_props_invalid', `${type}: ${issue.message}`);
  }
}

/**
 * Every `$slot`, `$collection`, `$form` and `$record` inside a node's props,
 * and every literal font (`{ family, source }`, `fontPropSchema`).
 */
function walkRefs(ctx: Context, file: string, path: Path, value: unknown, slug: string | null) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkRefs(ctx, file, [...path, index], item, slug));
    return;
  }
  if (!isRecord(value)) return;

  if (typeof value.family === 'string' && typeof value.source === 'string') {
    checkFontRef(ctx, file, path, value);
    return;
  }

  if (typeof value.$slot === 'string')
    checkSlotRef(ctx, file, [...path, '$slot'], value.$slot, slug);
  if (typeof value.$collection === 'string' && !ctx.spec.collections[value.$collection]) {
    unknown(ctx, file, [...path, '$collection'], `No collection "${value.$collection}"`);
  }
  if (typeof value.$form === 'string' && !ctx.forms.has(value.$form)) {
    unknown(ctx, file, [...path, '$form'], `No form "${value.$form}"`);
  }
  if (typeof value.$record === 'string') {
    const key = slug ? ctx.spec.pages[slug]?.collection : null;
    const collection = key ? ctx.spec.collections[key] : undefined;
    if (!key) {
      ctx.report.add(
        file,
        [...path, '$record'],
        'reference_unknown',
        'A `$record` binding needs a collection template page'
      );
    } else if (collection && !collection.fields.some((field) => field.key === value.$record)) {
      ctx.report.add(
        file,
        [...path, '$record'],
        'field_unknown',
        `Collection "${key}" has no field "${String(value.$record)}"`
      );
    }
  }
  for (const [key, child] of Object.entries(value)) {
    if (key.startsWith('$')) continue;
    walkRefs(ctx, file, [...path, key], child, slug);
  }
}

/**
 * A literal font in a block's props. The spec names a custom face by family
 * only: its file is the theme face's `src` (`site.json`), which the compilers
 * resolve to the asset. An `assetId` is an id and the spec has none, so it is
 * an unknown key, whatever its value.
 */
function checkFontRef(ctx: Context, file: string, path: Path, font: Record<string, unknown>) {
  if ('assetId' in font) {
    ctx.report.add(
      file,
      [...path, 'assetId'],
      'unknown_key',
      'A custom font is named by family; declare its face (with `src`) in site.json’s theme fonts'
    );
  }
  if (font.source === 'custom' && !ctx.customFonts.has(String(font.family))) {
    ctx.report.add(
      file,
      [...path, 'family'],
      'font_unknown',
      `No custom face "${String(font.family)}" in site.json’s theme fonts`
    );
  }
}

function checkSlotRef(ctx: Context, file: string, path: Path, ref: string, slug: string | null) {
  const prefix = `${SITE_SPEC_SITE_SCOPE}/`;
  if (ref.startsWith(prefix)) {
    if (!ctx.siteSlots.has(ref.slice(prefix.length))) {
      ctx.report.add(
        file,
        path,
        'slot_undeclared',
        `The site declares no slot "${ref.slice(prefix.length)}"`
      );
    }
    return;
  }
  if (!slug) {
    ctx.report.add(
      file,
      path,
      'slot_undeclared',
      `A component binds site slots only: "site/${ref}" if the site declares it`
    );
    return;
  }
  if (!ctx.pageSlots.get(slug)?.has(ref)) {
    ctx.report.add(file, path, 'slot_undeclared', `Page "${slug}" declares no slot "${ref}"`);
  }
}

/* -------------------------------------------------------------------------- */
/*                                   CONTENT                                  */
/* -------------------------------------------------------------------------- */

function checkContent(ctx: Context) {
  const locales = new Map(ctx.spec.site.locales.map((locale) => [locale.code, locale] as const));
  for (const locale of Object.keys(ctx.spec.content).sort()) {
    const file = `${SITE_SPEC_ROOT}/content/${locale}.json`;
    const entry = locales.get(locale);
    /* A disabled locale keeps its content: only an unknown one is wrong. */
    if (!entry) {
      ctx.report.add(file, [], 'locale_unknown', `The site lists no locale "${locale}"`);
    }
    for (const path of Object.keys(ctx.spec.content[locale]?.media ?? {})) {
      if (!(siteSpecMediaFile(path) in ctx.files)) {
        ctx.report.add(
          file,
          ['media', path],
          'media_missing',
          `No file ${siteSpecMediaFile(path)} for the medium ${path}`
        );
      }
    }
    const values = ctx.spec.content[locale]?.values ?? {};
    for (const [key, value] of Object.entries(values)) {
      const path: Path = ['values', key];
      const parts = parseSiteSpecContentKey(key);
      const slot = parts
        ? parts.scope === SITE_SPEC_SITE_SCOPE
          ? ctx.siteSlots.get(parts.slotKey)
          : ctx.pageSlots.get(parts.scope)?.get(parts.slotKey)
        : undefined;
      if (!slot) {
        if (ctx.complete) {
          ctx.report.add(file, path, 'content_slot_unknown', `No slot "${key}"`);
        }
      } else if (slot.kind !== value.kind) {
        ctx.report.add(
          file,
          [...path, 'kind'],
          'content_kind_mismatch',
          `Slot "${key}" is ${slot.kind}, not ${value.kind}`
        );
      }
      if (value.kind === 'navigation') {
        value.items.forEach((item, index) => {
          const links = [item, ...(item.children ?? [])];
          links.forEach((link, child) => {
            if (link.page && !ctx.spec.pages[link.page]) {
              const at: Path =
                child === 0
                  ? [...path, 'items', index, 'page']
                  : [...path, 'items', index, 'children', child - 1, 'page'];
              unknown(ctx, file, at, `No page "${link.page}"`);
            }
          });
        });
      }
      if (value.kind === 'dynamic' && value.collection && !ctx.spec.collections[value.collection]) {
        unknown(ctx, file, [...path, 'collection'], `No collection "${value.collection}"`);
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                 COLLECTIONS                                */
/* -------------------------------------------------------------------------- */

function checkCollections(ctx: Context) {
  const locales = new Set(ctx.spec.site.locales.map((locale) => locale.code));
  const formOwners = new Map<string, string>();
  let primary: string | null = null;

  for (const key of Object.keys(ctx.spec.collections).sort()) {
    const collection = ctx.spec.collections[key] as SiteSpecCollection;
    const file = `${SITE_SPEC_ROOT}/collections/${key}.json`;
    const fields = new Map(collection.fields.map((field) => [field.key, field] as const));

    collection.fields.forEach((field, index) => {
      if (field.relation && !ctx.spec.collections[field.relation.collection]) {
        unknown(
          ctx,
          file,
          ['fields', index, 'relation', 'collection'],
          `No collection "${field.relation.collection}"`
        );
      }
    });

    (collection.forms ?? []).forEach((form, index) => {
      const owner = formOwners.get(form.key);
      if (owner) {
        ctx.report.add(
          file,
          ['forms', index, 'key'],
          'key_duplicate',
          `The form key "${form.key}" is also collection "${owner}"’s`
        );
      } else {
        formOwners.set(form.key, key);
      }
      if (form.primary) {
        if (primary) {
          ctx.report.add(
            file,
            ['forms', index, 'primary'],
            'key_duplicate',
            `Only one primary form per site; "${primary}" is already`
          );
        } else {
          primary = form.key;
        }
      }
      for (const [name, target] of Object.entries(form.fieldMap)) {
        if (!fields.has(target)) {
          ctx.report.add(
            file,
            ['forms', index, 'fieldMap', name],
            'field_unknown',
            `Collection "${key}" has no field "${target}"`
          );
        }
      }
    });

    if (collection.websiteWritable && (collection.records?.length ?? 0) > 0) {
      ctx.report.add(
        file,
        ['records'],
        'records_not_allowed',
        'A website-writable collection’s records are visitor submissions: they never travel'
      );
      continue;
    }

    (collection.records ?? []).forEach((record, index) => {
      for (const [name, value] of Object.entries(record.data)) {
        const path: Path = ['records', index, 'data', name];
        const field = fields.get(name);
        if (!field) {
          ctx.report.add(file, path, 'field_unknown', `Collection "${key}" has no field "${name}"`);
          continue;
        }
        const perLocale = field.localized && isRecord(value) ? value : null;
        if (perLocale) {
          for (const locale of Object.keys(perLocale)) {
            if (!locales.has(locale)) {
              ctx.report.add(
                file,
                [...path, locale],
                'locale_unknown',
                `The site lists no locale "${locale}"`
              );
            }
          }
        }
        if (field.type === 'relation' && field.relation) {
          const target = ctx.spec.collections[field.relation.collection];
          const keys = Array.isArray(value) ? value : [value];
          keys.forEach((ref, at) => {
            if (ref === null) return;
            const where = Array.isArray(value) ? [...path, at] : path;
            if (typeof ref !== 'string') {
              ctx.report.add(file, where, 'schema_invalid', 'A relation names a record by key');
            } else if (target && !(target.records ?? []).some((row) => row.key === ref)) {
              unknown(
                ctx,
                file,
                where,
                `Collection "${field.relation?.collection}" has no record "${ref}"`
              );
            }
          });
        }
      }
    });
  }
}

/* -------------------------------------------------------------------------- */
/*                                    MEDIA                                   */
/* -------------------------------------------------------------------------- */

/** Every media path anywhere in the spec must have its file under `public/media/`. */
function checkMedia(ctx: Context) {
  const visit = (file: string, path: Path, value: unknown) => {
    if (typeof value === 'string') {
      if (isSiteSpecMediaPath(value) && !(siteSpecMediaFile(value) in ctx.files)) {
        ctx.report.add(
          file,
          path,
          'media_missing',
          `No file ${siteSpecMediaFile(value)} for the medium ${value}`
        );
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(file, [...path, index], item));
      return;
    }
    if (isRecord(value)) {
      for (const [key, child] of Object.entries(value)) visit(file, [...path, key], child);
    }
  };
  visit(SITE_SPEC_SITE_PATH, [], ctx.spec.site);
  for (const [slug, page] of Object.entries(ctx.spec.pages)) {
    visit(`${SITE_SPEC_ROOT}/pages/${slug}.json`, [], page);
  }
  for (const [locale, values] of Object.entries(ctx.spec.content)) {
    visit(`${SITE_SPEC_ROOT}/content/${locale}.json`, [], values);
  }
  for (const [key, collection] of Object.entries(ctx.spec.collections)) {
    visit(`${SITE_SPEC_ROOT}/collections/${key}.json`, [], collection);
  }
}
