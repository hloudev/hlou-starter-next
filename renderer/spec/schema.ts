/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { SITE_SPEC_FORMAT, SITE_SPEC_MEDIA_PATH, SITE_SPEC_SITE_SCOPE } from './paths';

import {
  fontFamilyNameSchema,
  hexColourSchema,
  NAVIGATION_CHILDREN_MAX,
  SITE_ATTRIBUTION_ALIGNS,
  SITE_ATTRIBUTION_EDGES,
  SITE_ATTRIBUTION_MAX_OFFSET,
  SITE_ATTRIBUTION_MODES,
  SITE_ATTRIBUTION_SHAPES,
  SITE_ATTRIBUTION_SIZES,
  SITE_ATTRIBUTION_TONES,
  siteThemeDensitySchema,
  siteThemeRadiusSchema,
  siteThemeTypographySchema,
  themeRoleKeySchema,
} from '../contracts';
import { SITE_SCHEME_KEY } from '../contracts/guards';
import { docNodeSchema, docPlaceValueSchema, siteComponentKindSchema } from '../doc/schema';

/*
 * The site spec, format 1 (M43-01, decision 219). Every object is `.strict()`:
 * a key the format does not know is an error the writer sees, never a value
 * silently dropped. No uuid anywhere: a row is named by its key, and the
 * uuids of the base sit in the generated lock (`./lock.ts`). Optional fields
 * carry no `.default()`, so what a file says is what it parses to; the
 * compilers (S3, S4) fill the documented defaults.
 *
 * Checks across a file (unique keys) run in `superRefine` and carry their
 * spec error code in `params.code`; checks across files (references, block
 * props, media) are `validateSiteSpec`'s (`./validate.ts`).
 */

/* -------------------------------------------------------------------------- */
/*                                Vocabularies                                */
/* -------------------------------------------------------------------------- */

/*
 * Copies of `@hlou/contracts`' structure enums and of
 * `@hlou/feature-collections`' vocabulary: the renderer imports no `@hlou/*`
 * package. `contracts/src/site-spec/vocabulary.test.ts` holds them equal.
 */
export const SPEC_PAGE_KINDS = ['static', 'collection_template', 'utility'] as const;
export const SPEC_PAGE_GROUPS = ['main', 'section_templates', 'utility'] as const;
export const SPEC_PAGE_STATUSES = ['draft', 'ready', 'published'] as const;
export const SPEC_SLOT_KINDS = [
  'text',
  'richtext',
  'heading',
  'media',
  'navigation',
  'dynamic',
] as const;
export const SPEC_FIELD_TYPES = [
  'text',
  'richtext',
  'slug',
  'number',
  'boolean',
  'date',
  'media',
  'select',
  'email',
  'relation',
  'money',
  'daterange',
  'phone',
  'country',
] as const;
export const SPEC_RECORD_STATUSES = ['draft', 'published', 'archived'] as const;
export const SPEC_RECORD_ENVIRONMENTS = ['production', 'preview'] as const;
export const SPEC_COLLECTION_DELIVERIES = ['static', 'live'] as const;
export const SPEC_RELATION_CARDINALITIES = ['one', 'many'] as const;
export const SPEC_SOCIAL_PLATFORMS = [
  'x',
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
  'tiktok',
] as const;

/* -------------------------------------------------------------------------- */
/*                                    Keys                                    */
/* -------------------------------------------------------------------------- */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A spec's own key — a page's slug, a component's, a record's: lowercase,
 * digits and single hyphens. The key grammar of the format.
 */
export const SITE_SPEC_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** A Structure section's key, as Structure stores it (`hero`, `room-grid`, `room_grid`). */
export const SITE_SPEC_SECTION_KEY = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
/**
 * A slot's key, as Structure stores it: `hero.headline`, `nav.links`, and the
 * reserved identity slots (`site.logoImage`, decision 145). Never a `/`, which
 * separates the scope from the slot in a content key.
 */
export const SITE_SPEC_SLOT_KEY = /^[a-z0-9]+(?:[._-][a-zA-Z0-9]+)*$/;
/** A collection's, a form's or a field's key, as Collections stores them (`site_settings`). */
export const SITE_SPEC_DATA_KEY = /^[a-z][a-z0-9_]*$/;
/** A site locale (`fr`, `en-GB`, `ar-TN`). */
export const SITE_SPEC_LOCALE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

function keySchema(pattern: RegExp, max: number, what: string) {
  return z
    .string()
    .min(1)
    .max(max)
    .regex(pattern, `Not a valid ${what}`)
    .refine((value) => !UUID.test(value), `A ${what} is a name, never a uuid`);
}

export const specPageSlugSchema = keySchema(SITE_SPEC_KEY, 64, 'page slug')
  .refine((value) => value !== SITE_SPEC_SITE_SCOPE, '`site` names the site scope, not a page')
  .describe('The page’s key: its file name in `pages/`, and how content and links name it.');
export const specComponentKeySchema = keySchema(SITE_SPEC_KEY, 64, 'component key');
export const specRecordKeySchema = keySchema(SITE_SPEC_KEY, 96, 'record key');
export const specSectionKeySchema = keySchema(SITE_SPEC_SECTION_KEY, 64, 'section key');
export const specSlotKeySchema = keySchema(SITE_SPEC_SLOT_KEY, 96, 'slot key');
export const specCollectionKeySchema = keySchema(SITE_SPEC_DATA_KEY, 64, 'collection key');
export const specFormKeySchema = keySchema(SITE_SPEC_DATA_KEY, 64, 'form key');
export const specFieldKeySchema = keySchema(SITE_SPEC_DATA_KEY, 64, 'field key');
export const specLocaleSchema = z
  .string()
  .regex(SITE_SPEC_LOCALE, 'Not a language tag such as fr, en-GB or ar-TN');

export const specMediaPathSchema = z
  .string()
  .regex(SITE_SPEC_MEDIA_PATH, 'A medium is `/media/<dir>/<file>`, served from `public/media/`')
  .describe('A medium by path: `/media/<dir>/<file>` is the file `public/media/<dir>/<file>`.');

/** Points an editor at the file’s JSON Schema; ignored by every reader. */
const $schema = z.string().optional().describe('The JSON Schema this file follows.');

/* -------------------------------------------------------------------------- */
/*                                  Uniqueness                                */
/* -------------------------------------------------------------------------- */

/** The error code a `superRefine` issue carries, for `validateSiteSpec`. */
export const DUPLICATE_KEY_CODE = 'key_duplicate';

/** Reports every repeat of `key` in `rows` at `[...path, index, field]`. */
export function checkUnique<T>(
  ctx: z.RefinementCtx,
  rows: readonly T[] | undefined,
  key: (row: T) => string,
  path: ReadonlyArray<string | number>,
  field = 'key',
  seen = new Set<string>()
): Set<string> {
  (rows ?? []).forEach((row, index) => {
    const value = key(row);
    if (seen.has(value)) {
      ctx.addIssue({
        code: 'custom',
        path: [...path, index, field],
        message: `Duplicate key "${value}"`,
        params: { code: DUPLICATE_KEY_CODE },
      });
    }
    seen.add(value);
  });
  return seen;
}

/* -------------------------------------------------------------------------- */
/*                                    Slots                                   */
/* -------------------------------------------------------------------------- */

/** A dynamic slot's query, as Structure stores it (`slotQuerySchema`). */
export const specSlotQuerySchema = z
  .object({
    filter: z
      .record(z.string().min(1).max(64), z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .optional(),
    sort: z
      .object({
        field: z.string().min(1).max(64),
        direction: z.enum(['asc', 'desc']).optional(),
      })
      .strict()
      .optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .strict();

export const specSlotSchema = z
  .object({
    key: specSlotKeySchema,
    kind: z.enum(SPEC_SLOT_KINDS),
    /** Absent = `false`. */
    required: z.boolean().optional(),
    /** Absent = `true`: one value per locale. `false`: one value for every locale. */
    localizable: z.boolean().optional(),
    /** A dynamic slot's collection. */
    collection: specCollectionKeySchema.nullable().optional(),
    query: specSlotQuerySchema.optional(),
  })
  .strict();
export type SpecSlot = z.infer<typeof specSlotSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Document                                  */
/* -------------------------------------------------------------------------- */

const specPlaceSchema = z
  .object({
    base: docPlaceValueSchema.strict().optional(),
    md: docPlaceValueSchema.strict().optional(),
    lg: docPlaceValueSchema.strict().optional(),
    xl: docPlaceValueSchema.strict().optional(),
  })
  .strict();

/**
 * A document v2 node (`@hlou/site-renderer/doc`), node id as it is, with the
 * spec's keys where the database holds ids: `section` names the page's
 * section by key, `instanceOf` a component by key, and inside `props`
 * `{ "$slot": "hero.title" }` names a slot of the page — `site/<key>` a site
 * slot — `{ "$collection" }` and `{ "$form" }` a key, and media a path.
 */
export const specDocNodeSchema = docNodeSchema
  .extend({
    section: specSectionKeySchema.optional(),
    instanceOf: specComponentKeySchema.optional(),
    place: specPlaceSchema.optional(),
  })
  .strict();
export type SpecDocNode = z.infer<typeof specDocNodeSchema>;

export const specDocumentSchema = z
  .object({
    root: z.string().min(1),
    rootProps: z.record(z.string(), z.unknown()),
    nodes: z.record(z.string().min(1), specDocNodeSchema),
  })
  .strict();
export type SpecDocument = z.infer<typeof specDocumentSchema>;

/* -------------------------------------------------------------------------- */
/*                                  site.json                                 */
/* -------------------------------------------------------------------------- */

export const specLocaleEntrySchema = z
  .object({
    code: specLocaleSchema,
    /** Absent = `true`. A disabled locale is kept and not published (decision 174). */
    enabled: z.boolean().optional(),
  })
  .strict();

const specSocialSchema = z
  .object(
    Object.fromEntries(
      SPEC_SOCIAL_PLATFORMS.map((platform) => [platform, z.string().max(200).optional()])
    ) as Record<(typeof SPEC_SOCIAL_PLATFORMS)[number], z.ZodOptional<z.ZodString>>
  )
  .strict();

/** `settings.site` (decision 145): what a machine reads once per site. */
export const specSiteSettingsSchema = z
  .object({
    /** The square mark the favicon set is drawn from; absent → the logo. */
    icon: specMediaPathSchema.nullable().optional(),
    titleTemplate: z.string().trim().min(1).max(120).optional(),
    themeColor: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i, 'Expected #rrggbb')
      .nullable()
      .optional(),
    social: specSocialSchema.optional(),
  })
  .strict();

/** `settings.attribution`, stored partial (the « Propulsé par Hlou » badge). */
export const specAttributionSchema = z
  .object({
    enabled: z.boolean().optional(),
    tone: z.enum(SITE_ATTRIBUTION_TONES).optional(),
    adaptive: z.boolean().optional(),
    size: z.enum(SITE_ATTRIBUTION_SIZES).optional(),
    shape: z.enum(SITE_ATTRIBUTION_SHAPES).optional(),
    align: z.enum(SITE_ATTRIBUTION_ALIGNS).optional(),
    mode: z.enum(SITE_ATTRIBUTION_MODES).optional(),
    edge: z.enum(SITE_ATTRIBUTION_EDGES).optional(),
    offsetX: z.number().int().min(0).max(SITE_ATTRIBUTION_MAX_OFFSET).optional(),
    offsetY: z.number().int().min(0).max(SITE_ATTRIBUTION_MAX_OFFSET).optional(),
  })
  .strict();

/** The project row's definition (decision 211): no name, slug or environment. */
export const specProjectSchema = z
  .object({
    sourceLocale: specLocaleSchema,
    /** Absent = `true`. */
    indexable: z.boolean().optional(),
    site: specSiteSettingsSchema.optional(),
    attribution: specAttributionSchema.optional(),
  })
  .strict();

const specColorRoleSchema = z
  .object({
    key: themeRoleKeySchema,
    label: z.string().optional(),
    value: hexColourSchema,
    dark: hexColourSchema.optional(),
  })
  .strict();

/** A font face: Google by family, or `custom` from a medium (`src`). */
const specFontFaceShape = {
  source: z.enum(['google', 'custom']),
  family: fontFamilyNameSchema,
  /** A `custom` face's file. */
  src: specMediaPathSchema.optional(),
  weights: z.array(z.number().int()).optional(),
};
const specFontFaceSchema = z.object(specFontFaceShape).strict();

const specFontRoleSchema = z
  .object({
    key: themeRoleKeySchema,
    label: z.string().optional(),
    ...specFontFaceShape,
    ...siteThemeTypographySchema.shape,
    localeOverrides: z.record(specLocaleSchema, specFontFaceSchema).optional(),
  })
  .strict();

const specSchemeSchema = z
  .object({
    key: z.string().regex(SITE_SCHEME_KEY, 'Expected a scheme key (a-z, 0-9, -)'),
    name: z.string().min(1).max(60),
    roles: z.record(
      themeRoleKeySchema,
      z.object({ value: hexColourSchema, dark: hexColourSchema.optional() }).strict()
    ),
  })
  .strict();

/** The project's theme (`themes.tokens`), its roles by key. */
export const specThemeSchema = z
  .object({
    name: z.string().optional(),
    colors: z.array(specColorRoleSchema).min(1),
    fonts: z.array(specFontRoleSchema).min(1),
    /** Absent = `base`. */
    density: siteThemeDensitySchema.optional(),
    /** Absent = `10`. */
    radius: siteThemeRadiusSchema.optional(),
    typeScale: z
      .object({
        xs: z.number().positive(),
        sm: z.number().positive(),
        md: z.number().positive(),
        lg: z.number().positive(),
        xl: z.number().positive(),
      })
      .strict()
      .optional(),
    schemes: z.array(specSchemeSchema).max(12).optional(),
  })
  .strict();

/** A site component (`site_components`): Header, Footer, a saved section. */
export const specComponentSchema = z
  .object({
    key: specComponentKeySchema,
    name: z.string(),
    kind: siteComponentKindSchema,
    document: specDocumentSchema,
  })
  .strict();

export const siteSpecSiteSchema = z
  .object({
    $schema,
    format: z.literal(SITE_SPEC_FORMAT),
    project: specProjectSchema,
    /** In order: the first is position 0. */
    locales: z.array(specLocaleEntrySchema).min(1),
    theme: specThemeSchema,
    components: z.array(specComponentSchema).optional(),
    /** Site-level slots (no page, no section): content names them `site/<key>`. */
    slots: z.array(specSlotSchema).optional(),
  })
  .strict()
  .superRefine((site, ctx) => {
    checkUnique(ctx, site.locales, (row) => row.code, ['locales'], 'code');
    checkUnique(ctx, site.components, (row) => row.key, ['components']);
    checkUnique(ctx, site.slots, (row) => row.key, ['slots']);
    checkUnique(ctx, site.theme.colors, (row) => row.key, ['theme', 'colors']);
    checkUnique(ctx, site.theme.fonts, (row) => row.key, ['theme', 'fonts']);
    checkUnique(ctx, site.theme.schemes, (row) => row.key, ['theme', 'schemes']);
    /* A custom face's file is its `src`: blocks name it by family only. */
    site.theme.fonts.forEach((role, index) => {
      const faces: Array<[Array<string | number>, { source: string; src?: string }]> = [
        [['theme', 'fonts', index], role],
        ...Object.entries(role.localeOverrides ?? {}).map(
          ([locale, face]) =>
            [['theme', 'fonts', index, 'localeOverrides', locale], face] as [
              Array<string | number>,
              { source: string; src?: string },
            ]
        ),
      ];
      for (const [path, face] of faces) {
        if (face.source === 'custom' && !face.src) {
          ctx.addIssue({
            code: 'custom',
            path: [...path, 'src'],
            message: 'A custom face names its file: `src: "/media/<dir>/<file>"`',
          });
        }
      }
    });
  });
export type SiteSpecSite = z.infer<typeof siteSpecSiteSchema>;

/* -------------------------------------------------------------------------- */
/*                               pages/<slug>.json                            */
/* -------------------------------------------------------------------------- */

/** An agency library key (decision 177): the one id the spec carries, opaque. */
export const SITE_SPEC_LIBRARY_PATTERN =
  /^t:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const specSectionPatternSchema = z
  .string()
  .regex(
    new RegExp(`^[a-z0-9]+(?:-[a-z0-9]+)*$|${SITE_SPEC_LIBRARY_PATTERN.source}`),
    'A pattern is a built-in key (`hero-left`) or an agency library key (`t:<uuid>`)'
  )
  .refine((value) => !UUID.test(value), 'A library pattern is `t:<uuid>`, never a bare uuid')
  .describe(
    'A built-in wireframe pattern key, or `t:<uuid>`: an agency library entry (decision 177), the one opaque external reference a spec may carry.'
  );

export const specSectionSchema = z
  .object({
    key: specSectionKeySchema,
    label: z.string(),
    /**
     * The wireframe pattern: a built-in key (`hero-left`), or an agency library
     * key `t:<uuid>` (decision 177). The library key is the spec's ONE opaque
     * external reference: it names the agency's library, outside the site, not
     * a row of it, so it carries the library's own id and no lock maps it.
     */
    pattern: specSectionPatternSchema.nullable().optional(),
    /** In order. */
    slots: z.array(specSlotSchema),
  })
  .strict();
export type SpecSection = z.infer<typeof specSectionSchema>;

export const siteSpecPageSchema = z
  .object({
    $schema,
    path: z
      .string()
      .min(1)
      .max(200)
      .regex(
        /^\/(?:[a-z0-9._~-]+|\[[a-z0-9_-]+\])(?:\/(?:[a-z0-9._~-]+|\[[a-z0-9_-]+\]))*$|^\/$/,
        'Not a page path (`/`, `/rooms`, `/rooms/[slug]`)'
      ),
    title: z.string(),
    /** The parent page's slug; absent or null = top level. */
    parent: specPageSlugSchema.nullable().optional(),
    /** Absent = `static`. */
    kind: z.enum(SPEC_PAGE_KINDS).optional(),
    /** Absent = `main`. */
    group: z.enum(SPEC_PAGE_GROUPS).optional(),
    /** Absent = `draft`. */
    status: z.enum(SPEC_PAGE_STATUSES).optional(),
    /** Absent = `true`. */
    indexable: z.boolean().optional(),
    /** Its place among its siblings; ties break by slug. */
    position: z.number().int(),
    /** A `collection_template` page's collection. */
    collection: specCollectionKeySchema.nullable().optional(),
    /** Where the page sits on Structure's map. */
    map: z
      .object({ x: z.number(), y: z.number(), collapsed: z.boolean().optional() })
      .strict()
      .optional(),
    /** Page-level slots (no section): `seo.title`, `seo.description`, `seo.image`. */
    slots: z.array(specSlotSchema).optional(),
    /** In order. */
    sections: z.array(specSectionSchema),
    /** The canvas document; absent = the page is only planned. */
    document: specDocumentSchema.optional(),
  })
  .strict()
  .superRefine((page, ctx) => {
    checkUnique(ctx, page.sections, (row) => row.key, ['sections']);
    /* One slot key per page, page-level and section slots together. */
    const seen = checkUnique(ctx, page.slots, (row) => row.key, ['slots']);
    page.sections.forEach((section, index) =>
      checkUnique(ctx, section.slots, (row) => row.key, ['sections', index, 'slots'], 'key', seen)
    );
  });
export type SiteSpecPage = z.infer<typeof siteSpecPageSchema>;

/* -------------------------------------------------------------------------- */
/*                             content/<locale>.json                          */
/* -------------------------------------------------------------------------- */

const navigationLinkShape = {
  label: z.string().optional(),
  href: z.string().optional(),
  /** A page of the spec, by slug; its path is resolved at render. */
  page: specPageSlugSchema.optional(),
};

export const specNavigationItemSchema = z
  .object({
    ...navigationLinkShape,
    children: z
      .array(z.object(navigationLinkShape).strict())
      .max(NAVIGATION_CHILDREN_MAX)
      .optional(),
  })
  .strict();

/**
 * One slot's value in one locale, in the form the content service stores
 * (`contentValueSchema`), with keys and paths for ids: a medium by `src`, a
 * link's page by slug, a dynamic value's collection by key.
 */
export const specContentValueSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('text'), text: z.string() }).strict(),
  z.object({ kind: z.literal('heading'), text: z.string() }).strict(),
  z
    .object({
      kind: z.literal('richtext'),
      /** TipTap JSON, as the Content editor writes it. */
      doc: z.unknown(),
      docVersion: z.number().int(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('media'),
      src: specMediaPathSchema,
      /** The medium's alternative text in this locale. */
      alt: z.string().optional(),
    })
    .strict(),
  z.object({ kind: z.literal('navigation'), items: z.array(specNavigationItemSchema) }).strict(),
  z
    .object({
      kind: z.literal('dynamic'),
      collection: specCollectionKeySchema.optional(),
      query: z
        .object({
          filter: z.record(z.string(), z.unknown()).optional(),
          sort: z
            .object({ field: z.string(), dir: z.enum(['asc', 'desc']) })
            .strict()
            .optional(),
          limit: z.number().int().positive().optional(),
        })
        .strict()
        .optional(),
    })
    .strict(),
]);
export type SpecContentValue = z.infer<typeof specContentValueSchema>;

/** `<pageSlug>/<slotKey>`, or `site/<slotKey>`. */
export const SITE_SPEC_CONTENT_KEY = new RegExp(
  `^(?:${SITE_SPEC_KEY.source.slice(1, -1)})/(?:${SITE_SPEC_SLOT_KEY.source.slice(1, -1)})$`
);

/**
 * A medium's own text in one locale (the asset's attributes): its alt text and
 * caption, wherever it is used. Additive in format 1 (M43-02, lead-approved).
 */
export const specMediaTextSchema = z
  .object({
    alt: z.string().optional(),
    caption: z.string().optional(),
  })
  .strict();
export type SpecMediaText = z.infer<typeof specMediaTextSchema>;

export const siteSpecContentSchema = z
  .object({
    $schema,
    /** Keyed `<pageSlug>/<slotKey>`, and `site/<slotKey>` for a site slot. */
    values: z.record(
      z.string().regex(SITE_SPEC_CONTENT_KEY, 'A content key is `<pageSlug>/<slotKey>`'),
      specContentValueSchema
    ),
    /**
     * Optional: each medium's alt text and caption in this locale, keyed by its
     * path. Its alt wins over a media value's `alt` for the same medium.
     */
    media: z.record(specMediaPathSchema, specMediaTextSchema).optional(),
  })
  .strict();
export type SiteSpecContent = z.infer<typeof siteSpecContentSchema>;

/* -------------------------------------------------------------------------- */
/*                            collections/<key>.json                          */
/* -------------------------------------------------------------------------- */

export const specFieldSchema = z
  .object({
    key: specFieldKeySchema,
    label: z.string(),
    type: z.enum(SPEC_FIELD_TYPES),
    /** Absent = `false`. */
    required: z.boolean().optional(),
    /** Absent = `false`: one value per locale when `true`. */
    localized: z.boolean().optional(),
    default: z.unknown().optional(),
    /** The type's options (`choices`, `currency`, `defaultCountry`), as Collections stores them. */
    options: z.record(z.string(), z.unknown()).optional(),
    /** A `relation` field's target. */
    relation: z
      .object({
        collection: specCollectionKeySchema,
        cardinality: z.enum(SPEC_RELATION_CARDINALITIES),
      })
      .strict()
      .optional(),
  })
  .strict();

export const specFormSchema = z
  .object({
    key: specFormKeySchema,
    label: z.string(),
    /** Form field → this collection's field key. */
    fieldMap: z.record(z.string().min(1).max(64), specFieldKeySchema),
    /** The form that heads the client's inbox; at most one per site. */
    primary: z.boolean().optional(),
  })
  .strict();

/**
 * A record: its data by field key, a localised field as `{ "<locale>": value }`,
 * a relation as the target record's key (or a list of keys), a medium as its
 * path.
 */
export const specRecordSchema = z
  .object({
    key: specRecordKeySchema,
    /** Absent = `draft`. */
    status: z.enum(SPEC_RECORD_STATUSES).optional(),
    /** Absent = `production`. */
    environment: z.enum(SPEC_RECORD_ENVIRONMENTS).optional(),
    slug: z.string().nullable().optional(),
    publishedAt: z.iso.datetime({ offset: true }).nullable().optional(),
    data: z.record(specFieldKeySchema, z.unknown()),
  })
  .strict();

export const siteSpecCollectionSchema = z
  .object({
    $schema,
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    /** Absent = `false`. */
    localized: z.boolean().optional(),
    /** Absent = `false`. */
    singleton: z.boolean().optional(),
    /** Absent = `false`. Its records are visitor submissions and never travel. */
    websiteWritable: z.boolean().optional(),
    /** Absent = `static`. */
    delivery: z.enum(SPEC_COLLECTION_DELIVERIES).optional(),
    /** Its place in the Collections list; ties break by key. */
    position: z.number().int().optional(),
    /** In order. */
    fields: z.array(specFieldSchema),
    forms: z.array(specFormSchema).optional(),
    /** Only for a collection that is not website-writable (decision 211). */
    records: z.array(specRecordSchema).optional(),
  })
  .strict()
  .superRefine((collection, ctx) => {
    checkUnique(ctx, collection.fields, (row) => row.key, ['fields']);
    checkUnique(ctx, collection.forms, (row) => row.key, ['forms']);
    checkUnique(ctx, collection.records, (row) => row.key, ['records']);
  });
export type SiteSpecCollection = z.infer<typeof siteSpecCollectionSchema>;
