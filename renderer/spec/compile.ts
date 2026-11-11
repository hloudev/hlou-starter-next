/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type {
  CollectionDoc,
  ContentValue,
  FieldDoc,
  FormDoc,
  MediaDoc,
  NavigationItem,
  PageDocV2,
  RecordDoc,
  SiteSnapshot,
  SiteThemeTokens,
  SlotDoc,
} from '../contracts';
import type { DocNode, PageDocument, SiteComponent } from '../doc/schema';
import type { SiteSpecLock } from './lock';
import type {
  SiteSpecCollection,
  SiteSpecPage,
  SpecContentValue,
  SpecDocument,
  SpecSlot,
} from './schema';
import type { SiteSpec, SiteSpecError, SiteSpecFiles } from './validate';
import { withBlockDefaults } from './block-props';
import { isSiteSpecMediaPath, parseSiteSpecContentKey, SITE_SPEC_SITE_SCOPE } from './paths';
import { validateSiteSpec } from './validate';

import { fieldCopy, siteSnapshotSchema, siteThemeTokensSchema } from '../contracts';
import { componentsFromSiteComposition, fromPuckData, withChromeInstances } from '../doc/from-puck';
import { subtreeIds } from '../doc/tree';
import { resolveAttribution } from '../site/attribution';

/*
 * The spec's first compiler (one spec, two compilers):
 * `hlou/site/**` → the `SiteSnapshot` the starter renders, so `pnpm dev`
 * shows a hand-edited spec the way Hlou would build it. Pure: no filesystem,
 * no clock, no network — the starter's `pnpm hlou:compile` reads the files
 * and writes what this returns (plus `content.ts`, the messages and the
 * Tailwind classes, from `../site/output` and `../blocks/design`).
 *
 * It gives what Hlou's own build gives for the
 * same definition, with three differences that are the starter's by nature:
 *
 * - **ids** are the lock's uuids where the lock has the row, and otherwise
 *   ids derived from the key (`page:home`, `slot:home/hero.title`,
 *   `media:/media/home/terrace.png`): the same spec, the same ids;
 * - **media** are served by the starter itself: `url` is the spec's path
 *   (`/media/<dir>/<file>`, the file `public/media/<dir>/<file>`), with no
 *   renditions or pinned version, and only the media the spec names (or the
 *   lock lists);
 * - **planned sections**: a Structure section no node draws is not added as
 *   an empty planned `section` node (that reconcile needs the agency's
 *   pattern catalog, which only Hlou has). A published site leaves an empty
 *   planned section out anyway, so the render is the same.
 */

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export interface CompileSiteSpecOptions {
  /**
   * The project's name and slug: the spec carries neither.
   * Absent → `hlou/export.json`'s, when the files hold one, else `Site` / `site`.
   */
  project?: { id?: string; name?: string; slug?: string };
  /** The site's hostname, when the starter knows one. Absent → none. */
  hostname?: string | null;
  /**
   * What the starter knows of a medium's file, by spec path: its size, read
   * from the image itself. Absent → the mime from the extension, no size.
   */
  media?: Readonly<Record<string, { mime?: string; width?: number; height?: number }>>;
  /** `generatedAt`. Absent → the epoch, so the same spec compiles to the same bytes. */
  generatedAt?: string;
}

export type SiteSpecCompileResult =
  | { ok: true; errors: []; snapshot: SiteSnapshot; spec: SiteSpec }
  | { ok: false; errors: SiteSpecError[]; snapshot: null; spec: null };

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** A copy of Hlou's RTL languages. */
export const SPEC_RTL_LANGUAGES = [
  'ar',
  'ckb',
  'dv',
  'fa',
  'he',
  'ps',
  'sd',
  'ug',
  'ur',
  'yi',
] as const;

/** A copy of Hlou's form input types: what a form asks for. */
export const SPEC_FORM_INPUT_FIELD_TYPES = [
  'text',
  'richtext',
  'email',
  'number',
  'boolean',
  'date',
  'select',
  'money',
  'daterange',
  'phone',
  'country',
] as const;

/** A copy of Hlou's cap on site data records. */
export const SPEC_RECORD_CAP = 500;

/** A copy of Hlou's default title template. */
export const SPEC_DEFAULT_TITLE_TEMPLATE = '{page} — {site}';

const EPOCH = '1970-01-01T00:00:00.000Z';

const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  woff2: 'font/woff2',
  woff: 'font/woff',
  ttf: 'font/ttf',
  otf: 'font/otf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  pdf: 'application/pdf',
};

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The direction of a site locale, as `resolveSiteDirection` answers it. */
export function specLocaleDirection(code: string): 'ltr' | 'rtl' {
  const language = code.split('-')[0]?.toLowerCase() ?? '';
  return (SPEC_RTL_LANGUAGES as readonly string[]).includes(language) ? 'rtl' : 'ltr';
}

/** A medium's mime from its file name; `application/octet-stream` when unknown. */
export function specMediaMime(path: string): string {
  const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';
}

/** The project `hlou/export.json` names, when the files carry one. */
function exportedProject(files: SiteSpecFiles): { id?: string; name?: string; slug?: string } {
  let raw = files['hlou/export.json'];
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      return {};
    }
  }
  if (!isRecord(raw) || !isRecord(raw.project)) return {};
  const { id, name, slug } = raw.project;
  return {
    ...(typeof id === 'string' && id ? { id } : {}),
    ...(typeof name === 'string' ? { name } : {}),
    ...(typeof slug === 'string' && slug ? { slug } : {}),
  };
}

/* -------------------------------------------------------------------------- */
/*                                     IDS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Every row's id: the lock's uuid when the base had the row, else one derived
 * from its key. A derived id is never a uuid (`<kind>:<key>`), so a row new
 * in the spec is told from one of the base at a glance.
 */
class Ids {
  constructor(private readonly lock: SiteSpecLock | null) {}

  private of(map: keyof SiteSpecLock, kind: string, key: string): string {
    const table = this.lock?.[map];
    const id = isRecord(table) ? table[key] : undefined;
    return typeof id === 'string' ? id : `${kind}:${key}`;
  }

  page(slug: string) {
    return this.of('pages', 'page', slug);
  }
  section(slug: string, key: string) {
    return this.of('sections', 'section', `${slug}/${key}`);
  }
  /** `scope` is a page's slug, or `site`. */
  slot(scope: string, key: string) {
    return this.of('slots', 'slot', `${scope}/${key}`);
  }
  component(key: string) {
    return this.of('components', 'component', key);
  }
  media(path: string) {
    return this.of('media', 'media', path);
  }
  record(collection: string, key: string) {
    return this.of('records', 'record', `${collection}/${key}`);
  }
}

/* -------------------------------------------------------------------------- */
/*                                  COMPILE                                   */
/* -------------------------------------------------------------------------- */

/**
 * Spec files → the `SiteSnapshot` the starter renders. Validates first
 * (`validateSiteSpec`): a spec with any error compiles to nothing, and the
 * errors say the file and the JSON path.
 */
export function compileSpecToSnapshot(
  files: SiteSpecFiles,
  options: CompileSiteSpecOptions = {}
): SiteSpecCompileResult {
  const validation = validateSiteSpec(files);
  if (!validation.ok) return { ok: false, errors: validation.errors, snapshot: null, spec: null };
  const snapshot = compileSiteSpec(validation.spec, {
    ...options,
    project: { ...exportedProject(files), ...options.project },
  });
  return { ok: true, errors: [], snapshot, spec: validation.spec };
}

/**
 * A spec that already validated → its snapshot. Throws only when the result
 * breaks the renderer's contract, which a valid spec never does.
 */
export function compileSiteSpec(
  spec: SiteSpec,
  options: CompileSiteSpecOptions = {}
): SiteSnapshot {
  const ids = new Ids(spec.lock);
  const { site } = spec;
  const enabled = site.locales.filter((locale) => locale.enabled !== false);

  const media = new MediaTable(ids, spec, options);
  const customFaces = new Map<string, string>();
  for (const role of site.theme.fonts) {
    for (const face of [role, ...Object.values(role.localeOverrides ?? {})]) {
      if (face.source === 'custom' && face.src && !customFaces.has(face.family)) {
        customFaces.set(face.family, media.id(face.src));
      }
    }
  }
  const refs: Refs = { ids, spec, customFaces };

  const components = compileComponents(refs);
  const collections = compileCollections(spec);

  const snapshot: SiteSnapshot = {
    version: 2,
    project: {
      id: options.project?.id ?? spec.lock?.projectId ?? 'local',
      name: options.project?.name ?? 'Site',
      slug: options.project?.slug ?? 'site',
    },
    domain: options.hostname ? { hostname: options.hostname } : null,
    locales: enabled.map((locale) => ({
      code: locale.code,
      isSource: locale.code === site.project.sourceLocale,
      dir: specLocaleDirection(locale.code),
    })),
    theme: compileTheme(spec, media),
    siteSlots: (site.slots ?? []).map((slot) =>
      toSlotDoc(slot, ids.slot(SITE_SPEC_SITE_SCOPE, slot.key), null)
    ),
    components,
    pages: compilePages(refs, components),
    content: compileContent(spec, ids, media, new Set(enabled.map((locale) => locale.code))),
    media: media.docs(),
    collections,
    records: compileRecords(spec, ids, media),
    forms: compileForms(spec),
    settings: {
      siteName: options.project?.name ?? 'Site',
      ...(site.project.site?.icon ? { iconAssetId: media.id(site.project.site.icon) } : {}),
      titleTemplate: site.project.site?.titleTemplate ?? SPEC_DEFAULT_TITLE_TEMPLATE,
      ...(site.project.site?.themeColor ? { themeColor: site.project.site.themeColor } : {}),
      social: { ...site.project.site?.social },
      indexable: site.project.indexable ?? true,
      attribution: resolveAttribution(site.project.attribution),
    },
    generatedAt: options.generatedAt ?? EPOCH,
  };

  /* The contract is the renderer's: what does not parse never reaches a page. */
  return siteSnapshotSchema.parse(snapshot);
}

/* -------------------------------------------------------------------------- */
/*                                    MEDIA                                   */
/* -------------------------------------------------------------------------- */

/**
 * Every medium the spec names — anywhere: content, records, the theme's
 * custom faces, the site icon, a block's literal `{ url }` — plus every one
 * the lock lists, keyed by id. Its alt text per locale is the content
 * file's `media[path].alt`, else the content values' (`{ kind: 'media',
 * src, alt }`), the first one in file order. The snapshot has no caption.
 */
class MediaTable {
  private readonly byPath = new Map<string, MediaDoc>();

  constructor(
    private readonly ids: Ids,
    spec: SiteSpec,
    private readonly options: CompileSiteSpecOptions
  ) {
    const visit = (value: unknown) => {
      if (typeof value === 'string') {
        if (isSiteSpecMediaPath(value)) this.id(value);
      } else if (Array.isArray(value)) value.forEach(visit);
      else if (isRecord(value)) Object.values(value).forEach(visit);
    };
    visit(spec.site);
    for (const slug of Object.keys(spec.pages).sort()) visit(spec.pages[slug]);
    for (const key of Object.keys(spec.collections).sort()) visit(spec.collections[key]);
    /* A medium's own text in a locale (`media[path].alt`) wins; else the first
       media value's `alt` in file order. */
    for (const locale of Object.keys(spec.content).sort()) {
      const texts = spec.content[locale]?.media ?? {};
      for (const path of Object.keys(texts).sort()) {
        const alt = texts[path]?.alt;
        if (alt !== undefined) this.doc(path).alt[locale] = alt;
      }
    }
    for (const locale of Object.keys(spec.content).sort()) {
      const values = spec.content[locale]?.values ?? {};
      for (const key of Object.keys(values).sort()) {
        const value = values[key];
        if (value?.kind !== 'media') continue;
        const doc = this.doc(value.src);
        if (value.alt !== undefined && doc.alt[locale] === undefined) doc.alt[locale] = value.alt;
      }
    }
    for (const path of Object.keys(spec.lock?.media ?? {}).sort()) {
      if (isSiteSpecMediaPath(path)) this.id(path);
    }
  }

  private doc(path: string): MediaDoc {
    const known = this.byPath.get(path);
    if (known) return known;
    const file = this.options.media?.[path];
    const doc: MediaDoc = {
      id: this.ids.media(path),
      url: path,
      mime: file?.mime ?? specMediaMime(path),
      ...(file?.width ? { width: file.width } : {}),
      ...(file?.height ? { height: file.height } : {}),
      alt: {},
    };
    this.byPath.set(path, doc);
    return doc;
  }

  /** The id of the medium at `path`, registering it. */
  id(path: string): string {
    return this.doc(path).id;
  }

  docs(): Record<string, MediaDoc> {
    const out: Record<string, MediaDoc> = {};
    for (const path of [...this.byPath.keys()].sort()) {
      const doc = this.byPath.get(path) as MediaDoc;
      out[doc.id] = doc;
    }
    return out;
  }
}

/* -------------------------------------------------------------------------- */
/*                                    THEME                                   */
/* -------------------------------------------------------------------------- */

function compileTheme(spec: SiteSpec, media: MediaTable): SiteThemeTokens {
  const { theme } = spec.site;
  const face = (value: {
    source: 'google' | 'custom';
    family: string;
    src?: string;
    weights?: number[];
  }) => ({
    source: value.source,
    family: value.family,
    ...(value.source === 'custom' && value.src ? { assetId: media.id(value.src) } : {}),
    ...(value.weights ? { weights: value.weights } : {}),
  });
  return siteThemeTokensSchema.parse({
    colors: theme.colors,
    fonts: theme.fonts.map((role) => {
      const { src: _src, localeOverrides, ...rest } = role;
      return {
        ...rest,
        ...face(role),
        ...(localeOverrides
          ? {
              localeOverrides: Object.fromEntries(
                Object.entries(localeOverrides).map(([locale, value]) => [locale, face(value)])
              ),
            }
          : {}),
      };
    }),
    ...(theme.density ? { density: theme.density } : {}),
    ...(theme.radius !== undefined ? { radius: theme.radius } : {}),
    ...(theme.typeScale ? { typeScale: theme.typeScale } : {}),
    ...(theme.schemes ? { schemes: theme.schemes } : {}),
  });
}

/* -------------------------------------------------------------------------- */
/*                                    SLOTS                                   */
/* -------------------------------------------------------------------------- */

function toSlotDoc(slot: SpecSlot, id: string, sectionKey: string | null): SlotDoc {
  return {
    id,
    key: slot.key,
    kind: slot.kind,
    required: slot.required ?? false,
    localizable: slot.localizable ?? true,
    sectionKey,
    collectionKey: slot.collection ?? null,
    query: slot.query
      ? {
          filter: slot.query.filter,
          sort: slot.query.sort
            ? { field: slot.query.sort.field, dir: slot.query.sort.direction ?? 'asc' }
            : undefined,
          limit: slot.query.limit,
        }
      : null,
  };
}

/* -------------------------------------------------------------------------- */
/*                                  DOCUMENTS                                 */
/* -------------------------------------------------------------------------- */

interface Refs {
  ids: Ids;
  spec: SiteSpec;
  /** A theme custom face's family → its file's asset id. */
  customFaces: Map<string, string>;
}

/**
 * A spec document → the stored one: a node's `section` key → the section's
 * id, `instanceOf` → the component's, `{ $slot }` → the slot's id, a custom
 * font named by family → its face's asset. `$collection`, `$form` and
 * `$record` name keys in both; a medium is its path in both. Hidden nodes
 * go, as the snapshot strips them.
 */
function compileDocument(refs: Refs, doc: SpecDocument, slug: string | null): PageDocument {
  const nodes: Record<string, DocNode> = {};
  for (const [id, node] of Object.entries(doc.nodes)) {
    const { section, instanceOf, props, overrides, ...rest } = node;
    nodes[id] = {
      ...rest,
      /* Over the block's defaults, as the validator checked them. */
      props: compileProps(refs, withBlockDefaults(node.type, props), slug) as Record<
        string,
        unknown
      >,
      ...(section !== undefined && slug ? { section: refs.ids.section(slug, section) } : {}),
      ...(instanceOf !== undefined ? { instanceOf: refs.ids.component(instanceOf) } : {}),
      ...(overrides !== undefined
        ? {
            overrides: Object.fromEntries(
              Object.entries(overrides).map(([target, values]) => [
                target,
                compileProps(refs, values, slug) as Record<string, unknown>,
              ])
            ),
          }
        : {}),
    };
  }
  return stripHidden({
    root: doc.root,
    rootProps: compileProps(refs, doc.rootProps, slug) as Record<string, unknown>,
    nodes,
  });
}

function compileProps(refs: Refs, value: unknown, slug: string | null): unknown {
  if (Array.isArray(value)) return value.map((item) => compileProps(refs, item, slug));
  if (!isRecord(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    out[key] = key.startsWith('$') ? child : compileProps(refs, child, slug);
  }
  if (typeof value.$slot === 'string') out.$slot = slotRef(refs, value.$slot, slug);
  if (
    value.source === 'custom' &&
    typeof value.family === 'string' &&
    refs.customFaces.has(value.family)
  ) {
    out.assetId = refs.customFaces.get(value.family);
  }
  return out;
}

/** `hero.title` → the page's slot id; `site/nav.links` → the site slot's. */
function slotRef(refs: Refs, ref: string, slug: string | null): string {
  const prefix = `${SITE_SPEC_SITE_SCOPE}/`;
  if (ref.startsWith(prefix)) return refs.ids.slot(SITE_SPEC_SITE_SCOPE, ref.slice(prefix.length));
  return slug ? refs.ids.slot(slug, ref) : ref;
}

/** A document without its hidden nodes (and what they hold): what a site renders. */
function stripHidden(doc: PageDocument): PageDocument {
  const hidden = Object.values(doc.nodes).filter((node) => node.hidden === true);
  if (hidden.length === 0) return doc;
  const gone = new Set(hidden.flatMap((node) => subtreeIds(doc, node.id)));
  return {
    ...doc,
    nodes: Object.fromEntries(Object.entries(doc.nodes).filter(([id]) => !gone.has(id))),
  };
}

/* -------------------------------------------------------------------------- */
/*                             COMPONENTS & PAGES                             */
/* -------------------------------------------------------------------------- */

const COMPONENT_RANK = ['header', 'footer', 'section'];

/** Header, Footer, then saved sections, each by key; empty chrome when the spec has none. */
function compileComponents(refs: Refs): SiteComponent[] {
  const declared = refs.spec.site.components ?? [];
  if (declared.length === 0) return componentsFromSiteComposition(null);
  return declared
    .map((component) => ({
      id: refs.ids.component(component.key),
      key: component.key,
      name: component.name,
      kind: component.kind,
      doc: compileDocument(refs, component.document, null),
    }))
    .sort(
      (a, b) =>
        COMPONENT_RANK.indexOf(a.kind) - COMPONENT_RANK.indexOf(b.kind) ||
        a.key.localeCompare(b.key)
    );
}

/** In `position` order, ties by slug (Hlou breaks them by creation). */
function compilePages(refs: Refs, components: SiteComponent[]): PageDocV2[] {
  const { ids, spec } = refs;
  const slugs = Object.keys(spec.pages).sort((a, b) => {
    const left = spec.pages[a] as SiteSpecPage;
    const right = spec.pages[b] as SiteSpecPage;
    return left.position - right.position || (a < b ? -1 : a > b ? 1 : 0);
  });
  return slugs.map((slug) => {
    const page = spec.pages[slug] as SiteSpecPage;
    return {
      id: ids.page(slug),
      path: page.path,
      kind: page.kind ?? 'static',
      title: page.title,
      status: page.status ?? 'draft',
      collectionKey: page.collection ?? null,
      indexable: page.indexable ?? true,
      slots: [
        ...(page.slots ?? []).map((slot) => toSlotDoc(slot, ids.slot(slug, slot.key), null)),
        ...page.sections.flatMap((section) =>
          section.slots.map((slot) => toSlotDoc(slot, ids.slot(slug, slot.key), section.key))
        ),
      ],
      /* A page only planned is its Header and Footer: what Hlou draws for it
         once its empty planned sections are left out. */
      doc: page.document
        ? compileDocument(refs, page.document, slug)
        : withChromeInstances(fromPuckData(null), components),
    };
  });
}

/* -------------------------------------------------------------------------- */
/*                                   CONTENT                                  */
/* -------------------------------------------------------------------------- */

/** `content[locale][slotId]`, for the enabled locales: a disabled one keeps its file, off the site. */
function compileContent(
  spec: SiteSpec,
  ids: Ids,
  media: MediaTable,
  enabled: ReadonlySet<string>
): SiteSnapshot['content'] {
  const out: SiteSnapshot['content'] = {};
  for (const locale of Object.keys(spec.content).sort()) {
    if (!enabled.has(locale)) continue;
    const values = spec.content[locale]?.values ?? {};
    for (const key of Object.keys(values).sort()) {
      const parts = parseSiteSpecContentKey(key);
      const value = values[key];
      if (!parts || !value) continue;
      (out[locale] ??= {})[ids.slot(parts.scope, parts.slotKey)] = compileValue(value, ids, media);
    }
  }
  return out;
}

function compileLink(
  link: { label?: string; href?: string; page?: string },
  ids: Ids
): Omit<NavigationItem, 'children'> {
  return {
    ...(link.label !== undefined ? { label: link.label } : {}),
    ...(link.href !== undefined ? { href: link.href } : {}),
    ...(link.page !== undefined ? { pageId: ids.page(link.page) } : {}),
  };
}

function compileValue(value: SpecContentValue, ids: Ids, media: MediaTable): ContentValue {
  switch (value.kind) {
    case 'media':
      return { kind: 'media', assetId: media.id(value.src) };
    case 'navigation':
      return {
        kind: 'navigation',
        items: value.items.map((item) => ({
          ...compileLink(item, ids),
          ...(item.children
            ? { children: item.children.map((child) => compileLink(child, ids)) }
            : {}),
        })),
      };
    case 'dynamic':
      return {
        kind: 'dynamic',
        ...(value.collection !== undefined ? { collectionKey: value.collection } : {}),
        ...(value.query !== undefined ? { query: value.query } : {}),
      };
    default:
      return value;
  }
}

/* -------------------------------------------------------------------------- */
/*                                 COLLECTIONS                                */
/* -------------------------------------------------------------------------- */

/** In `position` order (absent = 0), ties by key — as `readSiteData` maps them. */
function collectionKeys(spec: SiteSpec): string[] {
  return Object.keys(spec.collections).sort((a, b) => {
    const left = spec.collections[a]?.position ?? 0;
    const right = spec.collections[b]?.position ?? 0;
    return left - right || (a < b ? -1 : a > b ? 1 : 0);
  });
}

function compileField(field: SiteSpecCollection['fields'][number], localized: boolean): FieldDoc {
  const options = isRecord(field.options) ? field.options : {};
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required ?? false,
    /* A field is per-locale only inside a localized collection. */
    localized: (field.localized ?? false) && localized,
    ...(field.type === 'relation' && field.relation
      ? {
          relationCollectionKey: field.relation.collection,
          cardinality: field.relation.cardinality,
        }
      : {}),
    ...(field.type === 'select' && options.choices !== undefined
      ? { options: options.choices }
      : {}),
    ...(field.type === 'money' && options.currency
      ? { options: { currency: options.currency } }
      : {}),
    ...((field.type === 'phone' || field.type === 'country') && options.defaultCountry
      ? { options: { defaultCountry: options.defaultCountry } }
      : {}),
    /* What a form shows around the input, per locale (`localizeField`); a select's
       choice labels travel inside its choices. `toSiteData` does the same. */
    ...fieldCopy(options),
  };
}

function compileCollections(spec: SiteSpec): CollectionDoc[] {
  return collectionKeys(spec).map((key) => {
    const collection = spec.collections[key] as SiteSpecCollection;
    const localized = collection.localized ?? false;
    return {
      key,
      name: collection.name,
      ...(collection.description ? { description: collection.description } : {}),
      localized,
      isSingleton: collection.singleton ?? false,
      delivery: collection.websiteWritable ? 'static' : (collection.delivery ?? 'static'),
      fields: collection.fields.map((field) => compileField(field, localized)),
      ...(collection.websiteWritable ? { websiteWritable: true } : {}),
    };
  });
}

/** `fn` over a value, or over each locale's when the field is localized. */
function perLocale(value: unknown, localized: boolean, fn: (leaf: unknown) => unknown): unknown {
  if (localized && isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([locale, leaf]) => [locale, fn(leaf)]));
  }
  return fn(value);
}

/**
 * Published records only (what a snapshot freezes), both environments,
 * `publishedAt` newest first then id — `readSiteData`'s order — at most
 * `SPEC_RECORD_CAP` per collection. A relation's keys and a medium's path
 * become the ids the snapshot holds.
 */
function compileRecords(spec: SiteSpec, ids: Ids, media: MediaTable): SiteSnapshot['records'] {
  const out: SiteSnapshot['records'] = {};
  for (const key of collectionKeys(spec)) {
    const collection = spec.collections[key] as SiteSpecCollection;
    if (collection.websiteWritable) {
      out[key] = [];
      continue;
    }
    const fields = new Map(collection.fields.map((field) => [field.key, field] as const));
    const rows: RecordDoc[] = (collection.records ?? [])
      .filter((record) => (record.status ?? 'draft') === 'published')
      .map((record) => {
        const data: Record<string, unknown> = {};
        for (const [name, value] of Object.entries(record.data)) {
          const field = fields.get(name);
          const localized = (field?.localized ?? false) && (collection.localized ?? false);
          if (field?.type === 'media') {
            data[name] = perLocale(value, localized, (leaf) =>
              Array.isArray(leaf)
                ? leaf.map((item) => (isSiteSpecMediaPath(item) ? media.id(item) : item))
                : isSiteSpecMediaPath(leaf)
                  ? media.id(leaf)
                  : leaf
            );
          } else if (field?.type === 'relation' && field.relation) {
            const target = field.relation.collection;
            const toId = (ref: unknown) =>
              typeof ref === 'string' ? ids.record(target, ref) : ref;
            data[name] = perLocale(value, localized, (leaf) =>
              Array.isArray(leaf) ? leaf.map(toId) : toId(leaf)
            );
          } else {
            data[name] = value;
          }
        }
        return {
          id: ids.record(key, record.key),
          slug: record.slug ?? null,
          status: 'published' as const,
          data,
          publishedAt: record.publishedAt ? new Date(record.publishedAt).toISOString() : null,
          environment: record.environment ?? 'production',
        };
      })
      .sort((a, b) => {
        if (a.publishedAt !== b.publishedAt) {
          if (a.publishedAt === null) return 1;
          if (b.publishedAt === null) return -1;
          return a.publishedAt < b.publishedAt ? 1 : -1;
        }
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });
    out[key] = rows.slice(0, SPEC_RECORD_CAP);
  }
  return out;
}

/**
 * Every form, the primary first: its fields are the form-able ones its map
 * covers, in the collection's order — every form-able one when the map is
 * empty (`formFieldKeys`).
 */
function compileForms(spec: SiteSpec): FormDoc[] {
  const forms: Array<FormDoc & { primary: boolean }> = [];
  for (const key of collectionKeys(spec)) {
    const collection = spec.collections[key] as SiteSpecCollection;
    const usable = collection.fields.filter((field) =>
      (SPEC_FORM_INPUT_FIELD_TYPES as readonly string[]).includes(field.type)
    );
    for (const form of collection.forms ?? []) {
      const mapped = new Set(Object.values(form.fieldMap));
      forms.push({
        key: form.key,
        label: form.label,
        collectionKey: key,
        fieldKeys: usable
          .filter((field) => mapped.size === 0 || mapped.has(field.key))
          .map((field) => field.key),
        primary: form.primary ?? false,
      });
    }
  }
  return forms
    .map((form, index) => ({ form, index }))
    .sort((a, b) => Number(b.form.primary) - Number(a.form.primary) || a.index - b.index)
    .map(({ form: { primary: _primary, ...form } }) => form);
}
