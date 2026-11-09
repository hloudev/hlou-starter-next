/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import type { MediaRenditionPreset } from './guards';
import {
  AUDIO_RENDITION_LADDER,
  FONT_FAMILY_NAME,
  HEX_COLOUR,
  IMAGE_RENDITION_LADDER,
  isRecord,
  MEDIA_RENDITION_PRESETS,
  SITE_SCHEME_KEY,
  THEME_ROLE_KEY,
  VIDEO_RENDITION_LADDER,
} from './guards';

import { pageDocumentSchema, siteComponentSchema } from '../doc/schema';

/* The guards and constants a browser island reads, kept free of zod (`guards.ts`). */
export {
  AUDIO_RENDITION_LADDER,
  IMAGE_RENDITION_LADDER,
  isCollectionRef,
  isFontFamilyName,
  isFormRef,
  isHexColour,
  isRecordRef,
  isResolvedCollection,
  isResolvedForm,
  isResolvedMedia,
  isSlotRef,
  isStateRef,
  isThemeRoleKey,
  MEDIA_RENDITION_PRESETS,
  SITE_SCHEME_KEY,
  SITE_THEME_TYPOGRAPHY_KEYS,
  VIDEO_RENDITION_LADDER,
} from './guards';
export type { MediaRenditionPreset } from './guards';

/* The share-facts shape is a contract both audit sources write. */
export { headTagsToFacts, shareFactsSchema } from '../site/facts';
export type { ShareFacts } from '../site/facts';

/* The value shapes, shared with the collections validator. */
export * from './money';
export * from './country';
export * from './field-copy';

/* -------------------------------------------------------------------------- */
/*                                   LOCALE                                   */
/* -------------------------------------------------------------------------- */

export const siteLocaleInfoSchema = z.object({
  code: z.string().min(2),
  isSource: z.boolean(),
  dir: z.enum(['ltr', 'rtl']),
  label: z.string().optional(),
});
export type SiteLocaleInfo = z.infer<typeof siteLocaleInfoSchema>;

/* -------------------------------------------------------------------------- */
/*                                    THEME                                   */
/* -------------------------------------------------------------------------- */

export const hexColourSchema = z.string().regex(HEX_COLOUR, 'Expected a hex colour');

/**
 * Theme and block values end up INSIDE CSS the renderer writes — a role key
 * in a custom-property name (`--site-color-<key>`), a family in a quoted
 * `font-family`, a colour as a declaration value. React escapes HTML in a
 * `style` attribute, not `;` or `:`, so anything looser than the patterns in
 * `guards.ts` is a CSS injection on the published site.
 *
 * They are checked twice on purpose: by the schemas below, on write, and by
 * the `is*` guards at render — a composition's block props are stored as
 * `catchall(z.unknown())` (`puckDataSchema`), so a block's own schema never
 * ran on what its component receives.
 */
export const themeRoleKeySchema = z.string().regex(THEME_ROLE_KEY, 'Expected a role key');
export const fontFamilyNameSchema = z.string().regex(FONT_FAMILY_NAME, 'Expected a font family');

export const siteThemeTypeScaleSchema = z.object({
  xs: z.number().positive().default(11),
  sm: z.number().positive().default(14),
  md: z.number().positive().default(19),
  lg: z.number().positive().default(26),
  xl: z.number().positive().default(34),
});
export type SiteThemeTypeScale = z.infer<typeof siteThemeTypeScaleSchema>;

export const siteThemeDensitySchema = z.enum(['tight', 'base', 'roomy']);
export type SiteThemeDensity = z.infer<typeof siteThemeDensitySchema>;

export const siteThemeRadiusSchema = z.union([
  z.literal(0),
  z.literal(4),
  z.literal(10),
  z.literal(20),
]);
export type SiteThemeRadius = z.infer<typeof siteThemeRadiusSchema>;

/**
 * A named colour the theme offers as a role (`accent`, `paper`, `ink`, or any
 * role a project adds). `accent`/`paper`/`ink` are the three `site.css` keys
 * on structurally — see `PROTECTED_COLOR_KEYS` in `theme/index.ts` — every
 * other key is a free extension.
 */
export const siteThemeColorRoleSchema = z.object({
  key: themeRoleKeySchema,
  label: z.string().optional(),
  /** The light-scheme colour. */
  value: hexColourSchema,
  /** The dark-scheme colour. Optional and additive: a role without one (every
   *  role written before themes had two schemes) gets a colour DERIVED from
   *  `value` by `deriveDarkColors` (`theme/scheme.ts`), so every site has a
   *  dark mode whether or not anyone authored one. */
  dark: hexColourSchema.optional(),
});
export type SiteThemeColorRole = z.infer<typeof siteThemeColorRoleSchema>;

/** One colour role inside a scheme: its light value and, optionally, its dark one. */
export const siteThemeSchemeRoleSchema = z.object({
  value: hexColourSchema,
  /** Absent: derived from `value`, as for a theme role (`resolveDarkColors`). */
  dark: hexColourSchema.optional(),
});
export type SiteThemeSchemeRole = z.infer<typeof siteThemeSchemeRoleSchema>;

/**
 * A colour scheme: a named set of the theme's colour roles, re-pointed
 * for the sections that sit on it (`design.scheme` → `data-hl-scheme`) —
 * Relume's "colour scheme from the style guide". A role it does not name keeps
 * the theme's value; the dark side is derived per scheme like the theme's.
 */
export const siteThemeSchemeSchema = z.object({
  key: z.string().regex(SITE_SCHEME_KEY, 'Expected a scheme key (a-z, 0-9, -)'),
  name: z.string().min(1).max(60),
  roles: z.record(themeRoleKeySchema, siteThemeSchemeRoleSchema),
});
export type SiteThemeScheme = z.infer<typeof siteThemeSchemeSchema>;

/** Which of a theme's two palettes renders. Absent anywhere it's optional
 *  means "follow the visitor's system" (`color-scheme: light dark`). */
export const siteColorSchemeSchema = z.enum(['light', 'dark']);
export type SiteColorScheme = z.infer<typeof siteColorSchemeSchema>;

export const siteThemeFontSourceSchema = z.enum(['google', 'custom']);
export type SiteThemeFontSource = z.infer<typeof siteThemeFontSourceSchema>;

/**
 * A named font the theme offers as a role (`heading`, `body`, or any role a
 * project adds). `source: 'google'` loads `family` from Google Fonts by
 * name; `'custom'` points at an uploaded asset (`assetId`) — not wired to any
 * upload UI yet, so no role is `'custom'` in practice today.
 */
/** A font role's face — everything but the role `key`/`label`, so the same
 *  shape describes both the role's default and its per-locale substitutes. */
export const siteThemeFontFaceSchema = z.object({
  source: siteThemeFontSourceSchema,
  family: fontFamilyNameSchema,
  assetId: z.string().optional(),
  weights: z.array(z.number().int()).optional(),
});
export type SiteThemeFontFace = z.infer<typeof siteThemeFontFaceSchema>;

/**
 * A font level's typography beyond its family — each optional, and an absent
 * one leaves the element as its block draws it (a heading block's own size, a
 * card title's own tracking). Numbers only: they land in custom properties
 * (`--site-font-<key>-weight`…), so nothing here can carry a `;`. Not part
 * of the face — a locale substitutes the family, never the level's rhythm.
 */
export const siteThemeTypographySchema = z.object({
  /** 100–900, in steps of 100. */
  weight: z.number().int().min(100).max(900).multipleOf(100).optional(),
  /** Pixels. */
  size: z.number().min(6).max(240).optional(),
  /** Unitless, a multiple of the size. */
  lineHeight: z.number().min(0.5).max(4).optional(),
  /** Ems — `-0.02` tightens, `0.1` spaces an uppercase label. */
  letterSpacing: z.number().min(-0.2).max(1).optional(),
});
export type SiteThemeTypography = z.infer<typeof siteThemeTypographySchema>;

export const siteThemeFontRoleSchema = siteThemeFontFaceSchema.extend({
  key: themeRoleKeySchema,
  label: z.string().optional(),
  ...siteThemeTypographySchema.shape,
  /** A different face for a given project locale (code from
   *  `project_locales`/`SiteLocaleInfo`) — e.g. an Arabic-script body font.
   *  Additive and optional: an old role with no overrides is unaffected.
   *  Resolved by `resolveFontsForLocale` (`theme/fonts.ts`), the one place
   *  a render pass knows both the role and the page's own locale. */
  localeOverrides: z.record(z.string(), siteThemeFontFaceSchema).optional(),
});
export type SiteThemeFontRole = z.infer<typeof siteThemeFontRoleSchema>;

const DEFAULT_COLOR_ROLES: SiteThemeColorRole[] = [
  { key: 'accent', value: '#b0552f' },
  { key: 'paper', value: '#f4f1ea' },
  { key: 'ink', value: '#1c1a17' },
];
const DEFAULT_FONT_ROLES: SiteThemeFontRole[] = [
  { key: 'heading', source: 'google', family: 'Instrument Serif' },
  { key: 'body', source: 'google', family: 'Inter' },
];

/**
 * The theme used to be `{ accent, paper, ink, headingFont }` — three fixed
 * colours and a 2-value font enum. A project's theme now holds an
 * EXTENSIBLE list of colour and font roles instead, so it can offer more
 * than 3 colours and more than 2 fonts (and a `body` role, previously a
 * hardcoded, invisible `Inter`). Old rows live forever in `themes.tokens`
 * and inside every published `site_versions.snapshot`, so — same pattern as
 * `upgradeNavigationValue` below — the old shape upgrades ON READ rather
 * than through a migration. Nothing writes the old shape any more.
 */
function upgradeThemeTokens(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value;
  const candidate = value as Record<string, unknown>;
  if (Array.isArray(candidate.colors) && Array.isArray(candidate.fonts)) return value;

  const legacyHeadingFamily =
    candidate.headingFont === 'space-grotesk' ? 'Space Grotesk' : 'Instrument Serif';
  const colors: SiteThemeColorRole[] = [
    { key: 'accent', value: typeof candidate.accent === 'string' ? candidate.accent : '#b0552f' },
    { key: 'paper', value: typeof candidate.paper === 'string' ? candidate.paper : '#f4f1ea' },
    { key: 'ink', value: typeof candidate.ink === 'string' ? candidate.ink : '#1c1a17' },
  ];
  const fonts: SiteThemeFontRole[] = [
    { key: 'heading', source: 'google', family: legacyHeadingFamily },
    { key: 'body', source: 'google', family: 'Inter' },
  ];
  const { accent, paper, ink, headingFont, ...rest } = candidate;
  void accent;
  void paper;
  void ink;
  void headingFont;
  return { ...rest, colors, fonts };
}

const siteThemeTokensShapeSchema = z.object({
  colors: z.array(siteThemeColorRoleSchema).min(1).default(DEFAULT_COLOR_ROLES),
  fonts: z.array(siteThemeFontRoleSchema).min(1).default(DEFAULT_FONT_ROLES),
  density: siteThemeDensitySchema.default('base'),
  radius: siteThemeRadiusSchema.default(10),
  typeScale: siteThemeTypeScaleSchema.default({ xs: 11, sm: 14, md: 19, lg: 26, xl: 34 }),
  /** Colour schemes a section can sit on. Optional: a theme without any is unchanged. */
  schemes: z
    .array(siteThemeSchemeSchema)
    .max(12)
    .refine((list) => new Set(list.map((scheme) => scheme.key)).size === list.length, {
      message: 'Scheme keys must be unique',
    })
    .optional(),
});

export const siteThemeTokensSchema = z.preprocess(upgradeThemeTokens, siteThemeTokensShapeSchema);
export type SiteThemeTokens = z.infer<typeof siteThemeTokensShapeSchema>;

export const DEFAULT_THEME_TOKENS: SiteThemeTokens = siteThemeTokensShapeSchema.parse({});

/** `site.css` keys these three colour roles and the two font roles by name — a
 *  project's theme can edit them but never remove them. */
export const PROTECTED_COLOR_KEYS = ['accent', 'paper', 'ink'] as const;
export const PROTECTED_FONT_KEYS = ['heading', 'body'] as const;

/* -------------------------------------------------------------------------- */
/*                                COLLECTIONS                                 */
/* -------------------------------------------------------------------------- */

export const collectionQuerySchema = z.object({
  filter: z.record(z.string(), z.unknown()).optional(),
  sort: z.object({ field: z.string(), dir: z.enum(['asc', 'desc']) }).optional(),
  limit: z.number().int().positive().optional(),
});
export type CollectionQuery = z.infer<typeof collectionQuerySchema>;

export const fieldTypeSchema = z.enum([
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
]);
export type FieldType = z.infer<typeof fieldTypeSchema>;

export const fieldDocSchema = z.object({
  key: z.string().min(1),
  label: z.string(),
  type: fieldTypeSchema,
  required: z.boolean(),
  localized: z.boolean(),
  relationCollectionKey: z.string().optional(),
  cardinality: z.enum(['one', 'many']).optional(),
  options: z.unknown().optional(),
  /** The label per site locale; `label` is the source locale's, and the fallback. */
  labels: z.record(z.string(), z.string()).optional(),
  /** An input's placeholder per site locale. */
  placeholders: z.record(z.string(), z.string()).optional(),
  /** The placeholder for one locale: on a resolved form's fields only (`localizeField`). */
  placeholder: z.string().optional(),
});
export type FieldDoc = z.infer<typeof fieldDocSchema>;

export const collectionDeliverySchema = z.enum(['static', 'live']);
export type CollectionDelivery = z.infer<typeof collectionDeliverySchema>;

export const collectionDocSchema = z.object({
  key: z.string().min(1),
  name: z.string(),
  description: z.string().optional(),
  localized: z.boolean(),
  isSingleton: z.boolean(),
  delivery: collectionDeliverySchema.default('static'),
  fields: z.array(fieldDocSchema),
  /**
   * Its records are visitor submissions and never ship (CB-c). Absent =
   * `false`; the Design pickers read it, the renderer never does.
   */
  websiteWritable: z.boolean().optional(),
});
export type CollectionDoc = z.infer<typeof collectionDocSchema>;

export const recordStatusSchema = z.enum(['draft', 'published', 'archived']);
export type RecordStatus = z.infer<typeof recordStatusSchema>;

/**
 * The store a record belongs to: `production` is the portal's
 * Live, `preview` its Sandbox. A build is one or the other, so the same pair
 * names both.
 */
export const recordEnvironmentSchema = z.enum(['production', 'preview']);
export type RecordEnvironment = z.infer<typeof recordEnvironmentSchema>;

export const recordDocSchema = z.object({
  id: z.string().min(1),
  slug: z.string().nullable().optional(),
  status: recordStatusSchema,
  data: z.record(z.string(), z.unknown()),
  publishedAt: z.string().nullable().optional(),
  /** Absent = `production`: every snapshot frozen before Sandbox records shipped. */
  environment: recordEnvironmentSchema.optional(),
});
export type RecordDoc = z.infer<typeof recordDocSchema>;

export const formDocSchema = z.object({
  key: z.string().min(1),
  label: z.string(),
  collectionKey: z.string().min(1),
  fieldKeys: z.array(z.string()),
});
export type FormDoc = z.infer<typeof formDocSchema>;

/* -------------------------------------------------------------------------- */
/*                                   CONTENT                                  */
/* -------------------------------------------------------------------------- */

export const slotKindSchema = z.enum([
  'text',
  'richtext',
  'heading',
  'media',
  'navigation',
  'dynamic',
]);
export type SlotKind = z.infer<typeof slotKindSchema>;

/**
 * One entry of a navigation slot. `href` is the link when it is set; `pageId`
 * is the fallback, resolved against the snapshot's pages so a link authored
 * against a page follows it when Structure moves the page.
 */
const navigationLinkShape = {
  pageId: z.string().optional(),
  href: z.string().optional(),
  label: z.string().optional(),
};

/** At most this many links under one: a header dropdown, one level. */
export const NAVIGATION_CHILDREN_MAX = 8;

export const navigationItemSchema = z.object({
  ...navigationLinkShape,
  /** A dropdown under the link: one level, no children of their own. */
  children: z.array(z.object(navigationLinkShape)).max(NAVIGATION_CHILDREN_MAX).optional(),
});
export type NavigationItem = z.infer<typeof navigationItemSchema>;

/**
 * The pre-list navigation value — `{ kind, label, href, pageId }` flat on the
 * value — read as a one-item list.
 *
 * A navigation slot used to carry exactly ONE link, which is why a header's
 * link list could never bind to one: `resolveDoc` would have handed the
 * block an object where its prop wants an array, so the list stayed literal
 * in the composition and the Content rail advertised a slot nothing rendered.
 * Rows written before that fix are still in `content_values` and inside every
 * published `site_versions.snapshot`, and a snapshot must open years later —
 * so the old shape is upgraded on READ rather than migrated. Nothing writes
 * it any more; `emptyValueFor` and the editor produce `items` only.
 */
function upgradeNavigationValue(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value;
  const candidate = value as { kind?: unknown; items?: unknown };
  if (candidate.kind !== 'navigation' || Array.isArray(candidate.items)) return value;
  const { kind, ...link } = value as Record<string, unknown>;
  const empty = !link.label && !link.href && !link.pageId;
  return { kind, items: empty ? [] : [link] };
}

export const contentValueSchema = z.preprocess(
  upgradeNavigationValue,
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('text'), text: z.string() }),
    z.object({ kind: z.literal('heading'), text: z.string() }),
    z.object({ kind: z.literal('richtext'), doc: z.unknown(), docVersion: z.number().int() }),
    z.object({ kind: z.literal('media'), assetId: z.string().min(1) }),
    z.object({ kind: z.literal('navigation'), items: z.array(navigationItemSchema) }),
    z.object({
      kind: z.literal('dynamic'),
      collectionKey: z.string().optional(),
      query: collectionQuerySchema.optional(),
    }),
  ])
);
export type ContentValue = z.infer<typeof contentValueSchema>;

export const slotDocSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  kind: slotKindSchema,
  required: z.boolean(),
  localizable: z.boolean(),
  sectionKey: z.string().nullable().optional(),
  collectionKey: z.string().nullable().optional(),
  query: collectionQuerySchema.nullable().optional(),
});
export type SlotDoc = z.infer<typeof slotDocSchema>;

/* -------------------------------------------------------------------------- */
/*                                 RENDITIONS                                 */
/* -------------------------------------------------------------------------- */

export const MEDIA_RENDITION_PRESET_KEYS = Object.keys(
  MEDIA_RENDITION_PRESETS
) as MediaRenditionPreset[];
export const mediaRenditionPresetSchema = z.enum(
  MEDIA_RENDITION_PRESET_KEYS as [MediaRenditionPreset, ...MediaRenditionPreset[]]
);

/**
 * The size a media value is served at: `auto` (absent) lets
 * the site pick — a `srcset` of the ready rungs for an image, the 720p → 480p
 * ladder for a video, 128k for audio; a rung serves that rung (or the nearest
 * ready larger one); `original` serves the uploaded file. The video and audio
 * rungs are sizes too: the inspector offers them on those kinds.
 */
export const MEDIA_SIZES = [
  'auto',
  ...IMAGE_RENDITION_LADDER,
  ...VIDEO_RENDITION_LADDER,
  ...AUDIO_RENDITION_LADDER,
  'original',
] as const;
export type MediaSize = (typeof MEDIA_SIZES)[number];
export const mediaSizeSchema = z.enum(MEDIA_SIZES);

export function isMediaSize(value: unknown): value is MediaSize {
  return typeof value === 'string' && (MEDIA_SIZES as readonly string[]).includes(value);
}

/**
 * One ready rendition as a render reads it: where its bytes are in THIS
 * context (the editor's `?r=`, a published route's `?r=`, a build's
 * `/media/<id>/<preset>.<ext>`), and what it measures.
 */
export const mediaRenditionRefSchema = z.object({
  url: z.string().min(1),
  mime: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().nonnegative().optional(),
});
export type MediaRenditionRef = z.infer<typeof mediaRenditionRefSchema>;

export const mediaRenditionsSchema = z.partialRecord(
  mediaRenditionPresetSchema,
  mediaRenditionRefSchema
);
export type MediaRenditions = z.infer<typeof mediaRenditionsSchema>;

export const mediaDocSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  mime: z.string(),
  alt: z.record(z.string(), z.string()),
  /** Video and audio: the current version's length. */
  durationMs: z.number().int().nonnegative().optional(),
  /** The current version's READY renditions, keyed by preset. */
  renditions: mediaRenditionsSchema.optional(),
  /**
   * The `media_asset_versions` row a frozen snapshot pins: the published read
   * and a rebuild of the version serve THESE bytes, so a later promote or
   * rollback in the library never changes what an old version shows. Absent
   * on a snapshot frozen before the pin — that one follows the current
   * version, as every snapshot used to.
   */
  versionId: z.string().min(1).optional(),
  /** The pinned version's sha256, when its upload stamped one. */
  sha256: z.string().min(1).optional(),
});
export type MediaDoc = z.infer<typeof mediaDocSchema>;

/* -------------------------------------------------------------------------- */
/*                                  BINDINGS                                  */
/* -------------------------------------------------------------------------- */

/**
 * A block prop bound to a content slot. `resolveDoc` replaces it with the
 * locale's content value.
 */
export const slotRefSchema = z.object({ $slot: z.string().min(1) });
export type SlotRef = z.infer<typeof slotRefSchema>;

/**
 * A block prop fed by a collection's published records.
 */
export const collectionRefSchema = z.object({
  $collection: z.string().min(1),
  query: collectionQuerySchema.optional(),
});
export type CollectionRef = z.infer<typeof collectionRefSchema>;

/**
 * A block prop fed by a site form (its collection's fields).
 */
export const formRefSchema = z.object({ $form: z.string().min(1) });
export type FormRef = z.infer<typeof formRefSchema>;

/**
 * On a `collection_template` page, a prop fed by the current record's field.
 */
export const recordRefSchema = z.object({ $record: z.string().min(1) });
export type RecordRef = z.infer<typeof recordRefSchema>;

export type Bound<T> = T | SlotRef | RecordRef;

/**
 * A block prop bound to a value of the nearest `scope`: the
 * render pass replaces it with the formatted value of the scope's snapshot,
 * and the scope runtime keeps it current in the browser. `resolveDoc` leaves
 * it alone.
 */
export const stateRefSchema = z.object({
  $state: z.string().min(1),
  format: z
    .enum(['text', 'integer', 'number', 'currency', 'date', 'dateRange', 'nights'])
    .optional(),
});
export type StateRef = z.infer<typeof stateRefSchema>;
export type StateFormat = NonNullable<StateRef['format']>;

/** `Bound<T>`, plus a scope value — the opt-in props of `stateBoundSchema`. */
export type StateBound<T> = Bound<T> | StateRef;

/**
 * Metadata keys the Puck field generator reads to pick a custom field. They
 * ride on zod v4's `.meta()` so a schema stays a plain schema everywhere else.
 */
export type BoundMeta = {
  hl:
    | 'bound'
    | 'collection'
    | 'form'
    | 'richtext'
    | 'media'
    | 'longtext'
    | 'slot'
    | 'color'
    | 'font'
    | 'responsive'
    | 'position'
    | 'floatingSlot'
    | 'style'
    | 'elements'
    /* The key of one field of the block's bound collection (a listing's mapping). */
    | 'fieldKey'
    /* A code variant: set by code, no inspector field. */
    | 'codeVariant'
    /* Written by the document itself (a planned section's glyph): no inspector field. */
    | 'internal'
    /* A scope's fields, steps and derived values, a button's action:
       a JSON editor until the Canvas kinds land. */
    | 'scopeFields'
    | 'scopeSteps'
    | 'scopeDerived'
    | 'action'
    /* A path into the nearest scope (`adults`, `dates.from`, `$step`): a widget's
       `bind.path`. Plain text standalone; the Design inspector picks it. */
    | 'statePath';
  /** For `responsive`: the control that edits one breakpoint's value. */
  control?: ResponsiveControl;
  /** For `elements`: the styleable element names, in the order offered. */
  elements?: string[];
  /** For `fieldKey`: the collection field types it may name. */
  fieldTypes?: FieldType[];
  /** For `bound`: the prop also takes a `{ $state }` scope value. */
  state?: true;
  /** For `slot`: block types this slot refuses besides `SLOT_DISALLOWED` (a scope's `scope`). */
  disallow?: string[];
};

/**
 * What a `responsive` prop holds per breakpoint (`blocks/tw.ts`): one gap
 * step, one aspect ratio. Everything else a block's style covers goes
 * through `style` / `elements`.
 */
export type ResponsiveControl = 'gap' | 'aspect' | 'columns' | 'direction';

/**
 * `T | { $slot } | { $record }` — the literal stays first so `.parse()` on a
 * literal never lands on the ref branch, and the Puck field generator finds the
 * literal's own field on `options[0]`.
 */
export function boundSchema<T extends z.ZodType>(inner: T) {
  return z.union([inner, slotRefSchema, recordRefSchema]).meta({ hl: 'bound' } satisfies BoundMeta);
}

/**
 * `boundSchema`, plus `{ $state }`: a prop that may show a value of the
 * nearest scope. Opt-in, prop by prop: `heading.text`,
 * `button.label`, `statement.text`, the `stats` values, widget props.
 */
export function stateBoundSchema<T extends z.ZodType>(inner: T) {
  return z
    .union([inner, slotRefSchema, recordRefSchema, stateRefSchema])
    .meta({ hl: 'bound', state: true } satisfies BoundMeta);
}

/** The shape a resolved `{ kind: 'media' }` slot takes inside block props. */
export const resolvedMediaSchema = z
  .object({
    url: z.string(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    alt: z.string().optional(),
    /** What the site serves; absent = `auto`. */
    size: mediaSizeSchema.optional(),
    /** The asset's mime, when known — a GIF and a video are served differently. */
    mime: z.string().optional(),
    /**
     * Written by the URL rewrite (`withResolvedMediaUrls`) and the resolver,
     * never by the editor: the ready rungs, with this context's URLs.
     */
    renditions: mediaRenditionsSchema.optional(),
  })
  .meta({ hl: 'media' } satisfies BoundMeta);
export type ResolvedMedia = z.infer<typeof resolvedMediaSchema>;

/**
 * `boundSchema(resolvedMediaSchema)`, whose references may carry the served
 * size beside the binding (`{ $slot, size }`, `{ $record, size }`): the
 * resolver lays it onto the media it resolves.
 */
export function boundMediaSchema() {
  const size = { size: mediaSizeSchema.optional() };
  return z
    .union([resolvedMediaSchema, slotRefSchema.extend(size), recordRefSchema.extend(size)])
    .meta({ hl: 'bound' } satisfies BoundMeta);
}

/** TipTap JSON, opaque to the contract; `renderRichText` walks it. */
export const richTextDocSchema = z.unknown().meta({ hl: 'richtext' } satisfies BoundMeta);

/** A `z.string()` the inspector should edit in a textarea. */
export const longTextSchema = z.string().meta({ hl: 'longtext' } satisfies BoundMeta);

export const collectionSourceSchema = collectionRefSchema.meta({
  hl: 'collection',
} satisfies BoundMeta);

export const formSourceSchema = formRefSchema.meta({ hl: 'form' } satisfies BoundMeta);

/* -------------------------------------------------------------------------- */
/*                                 PUCK DATA                                  */
/* -------------------------------------------------------------------------- */

export const puckComponentDataSchema = z.object({
  type: z.string().min(1),
  props: z.object({ id: z.string().min(1) }).catchall(z.unknown()),
  readOnly: z.record(z.string(), z.boolean()).optional(),
});
export type PuckComponentData = z.infer<typeof puckComponentDataSchema>;

/**
 * A slot prop: the blocks a layout block (section, grid) contains. Stored as
 * an array of component data, exactly like `content`; the Puck field is
 * `slot`, so the canvas draws a drop zone there and the nested blocks are
 * blocks of their own (`extractBindings`, `countBlocks` walk into them).
 */
export const slotContentSchema = z
  .array(puckComponentDataSchema)
  .meta({ hl: 'slot' } satisfies BoundMeta);
export type SlotContent = PuckComponentData[];

/**
 * A block's floating layer: the free elements (`floating` blocks) drawn
 * over it at absolute positions. Stored like any slot; the Puck field only
 * accepts `floating`, and no other slot accepts one.
 */
export const floatingSlotSchema = z
  .array(puckComponentDataSchema)
  .meta({ hl: 'floatingSlot' } satisfies BoundMeta);

export const puckDataSchema = z.object({
  root: z
    .object({ props: z.record(z.string(), z.unknown()).optional() })
    .catchall(z.unknown())
    .default({}),
  content: z.array(puckComponentDataSchema),
  // Tolerated for data Puck migrated from before slot fields; never read.
  zones: z.record(z.string(), z.array(puckComponentDataSchema)).optional(),
});
export type PuckData = z.infer<typeof puckDataSchema>;

/* -------------------------------------------------------------------------- */
/*                                    PAGES                                   */
/* -------------------------------------------------------------------------- */

export const pageKindSchema = z.enum(['static', 'collection_template', 'utility']);
export type PageKind = z.infer<typeof pageKindSchema>;

export const pageStatusSchema = z.enum(['draft', 'ready', 'published']);
export type PageStatus = z.infer<typeof pageStatusSchema>;

/** A page as the sitemap describes it — everything but its tree. */
export const pageMetaSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  kind: pageKindSchema,
  title: z.string(),
  status: pageStatusSchema,
  collectionKey: z.string().nullable().optional(),
  slots: z.array(slotDocSchema),
  /** `false` keeps the page out of search (`noindex`) and out of the sitemap. */
  indexable: z.boolean().default(true),
});
export type PageMeta = z.infer<typeof pageMetaSchema>;

/** A snapshot's page: its meta and its flat document. */
export const pageDocV2Schema = pageMetaSchema.extend({ doc: pageDocumentSchema });
export type PageDocV2 = z.infer<typeof pageDocV2Schema>;

/* -------------------------------------------------------------------------- */
/*                                  SNAPSHOT                                  */
/* -------------------------------------------------------------------------- */

/**
 * A site's social profiles — profile URLs (the app normalises a handle on
 * write); a bare handle is tolerated. JSON-LD `sameAs` lists them, `x` also
 * gives `twitter:site`.
 */
export const siteSocialSchema = z.object({
  x: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
  tiktok: z.string().optional(),
});
export type SiteSocial = z.infer<typeof siteSocialSchema>;

/** The « Propulsé par Hlou » badge's styles. */
export const SITE_ATTRIBUTION_TONES = [
  'light',
  'dark',
  'glass',
  'brand',
  'mono-ink',
  'mono-paper',
  'text-only',
  'mark-only',
] as const;
export const SITE_ATTRIBUTION_SIZES = ['s', 'm', 'l'] as const;
export const SITE_ATTRIBUTION_SHAPES = ['pill', 'rounded'] as const;
/** Where it sits along the line it is on: the inline start, middle or end. */
export const SITE_ATTRIBUTION_ALIGNS = ['start', 'center', 'end'] as const;
/** `inline`: in the page's flow (the footer's legal row, or a row of its own) ·
 *  `float`: pinned to the viewport at an offset from an edge and the aligned side. */
export const SITE_ATTRIBUTION_MODES = ['inline', 'float'] as const;
export const SITE_ATTRIBUTION_EDGES = ['bottom', 'top'] as const;
/** The largest offset of a floating badge, in px. */
export const SITE_ATTRIBUTION_MAX_OFFSET = 200;

/**
 * The attribution badge a site carries. Absent from a snapshot = no badge, so
 * a version frozen before the badge existed renders as it was built; the
 * project's default (shown, `light`, adaptive) is applied when the snapshot
 * is built (`resolveAttribution`).
 *
 * By default the badge closes the Footer block's legal row, or a row of its
 * own after the content when the page draws no footer; `align`
 * moves it to the start, middle or end of that line. In `float` mode it is
 * pinned to the viewport instead (`edge`, `align`, `offsetX`, `offsetY`).
 * A `position` a project stored before these fields existed is stripped on parse.
 */
export const siteAttributionSchema = z.object({
  enabled: z.boolean(),
  tone: z.enum(SITE_ATTRIBUTION_TONES),
  /** Swap to the tone's dark twin when the page renders dark (`light-dark()`). */
  adaptive: z.boolean(),
  size: z.enum(SITE_ATTRIBUTION_SIZES),
  shape: z.enum(SITE_ATTRIBUTION_SHAPES),
  /* The placement fields default on parse: a version frozen before they
     existed keeps its badge, at the end of its line. */
  align: z.enum(SITE_ATTRIBUTION_ALIGNS).default('end'),
  mode: z.enum(SITE_ATTRIBUTION_MODES).default('inline'),
  /** Floating only: the viewport edge it is pinned to. */
  edge: z.enum(SITE_ATTRIBUTION_EDGES).default('bottom'),
  /** Floating only: distance from the aligned side (the edge itself when centred: unused). */
  offsetX: z.number().int().min(0).max(SITE_ATTRIBUTION_MAX_OFFSET).default(16),
  /** Floating only: distance from `edge`. */
  offsetY: z.number().int().min(0).max(SITE_ATTRIBUTION_MAX_OFFSET).default(16),
});
export type SiteAttribution = z.infer<typeof siteAttributionSchema>;
export type SiteAttributionTone = SiteAttribution['tone'];

export const DEFAULT_SITE_ATTRIBUTION: SiteAttribution = {
  enabled: true,
  tone: 'light',
  adaptive: true,
  size: 'm',
  shape: 'pill',
  align: 'end',
  mode: 'inline',
  edge: 'bottom',
  offsetX: 16,
  offsetY: 16,
};

/**
 * What a machine reads once per site. What a visitor reads and
 * can differ per language is a site slot instead — `site.name`,
 * `site.tagline`, `seo.description`, `seo.image`, `site.logoImage` — and
 * `siteName` / `description` here are only the fallbacks of a snapshot that
 * carries none. Asset ids, never URLs: a URL here would escape the media
 * rewrites (`withResolvedMediaUrls`, materialise's copy).
 */
export const siteSettingsSchema = z.object({
  siteName: z.string().optional(),
  description: z.string().optional(),
  /** The square mark the favicon set is generated from; empty → the logo. */
  iconAssetId: z.string().min(1).optional(),
  /** `{page} — {site}`: `{page}` is the page's title, `{site}` the site name. */
  titleTemplate: z.string().optional(),
  /** The one browser / installed-app colour; empty → the theme's accent. */
  themeColor: hexColourSchema.optional(),
  social: siteSocialSchema.optional(),
  /** `false` keeps the whole site out of search engines. */
  indexable: z.boolean().optional(),
  analytics: z.object({ plausibleDomain: z.string().optional() }).optional(),
  attribution: siteAttributionSchema.optional(),
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

/**
 * What the renderer draws a site from: version 2 only.
 * Pages carry flat documents (`doc`); `components` (Header, Footer,
 * later saved sections) are the documents their `instance` nodes place.
 */
export const siteSnapshotSchema = z.object({
  version: z.literal(2),
  project: z.object({ id: z.string().min(1), name: z.string(), slug: z.string().min(1) }),
  domain: z.object({ hostname: z.string().min(1) }).nullable(),
  locales: z
    .array(siteLocaleInfoSchema)
    .min(1)
    .refine((locales) => locales.filter((locale) => locale.isSource).length === 1, {
      message: 'Exactly one locale must be the source',
    }),
  theme: siteThemeTokensSchema,
  siteSlots: z.array(slotDocSchema),
  pages: z.array(pageDocV2Schema),
  components: z.array(siteComponentSchema),
  content: z.record(z.string(), z.record(z.string(), contentValueSchema)),
  media: z.record(z.string(), mediaDocSchema),
  collections: z.array(collectionDocSchema),
  records: z.record(z.string(), z.array(recordDocSchema)),
  forms: z.array(formDocSchema),
  settings: siteSettingsSchema.default({}),
  /** The palette this build is pinned to — the Design / Preview toolbar's scheme at
   *  the moment it was frozen. Absent = follow the visitor's system. */
  colorScheme: siteColorSchemeSchema.optional(),
  /** The URL paths of the legacy pages this build lays beside Hlou's (decision
   *  187: `/cours/`, `/about.html`). Written by the builder, never stored in a
   *  version: a link to one stays unprefixed. */
  legacyPaths: z.array(z.string()).optional(),
  generatedAt: z.iso.datetime({ offset: true }),
});
export type SiteSnapshot = z.infer<typeof siteSnapshotSchema>;

/* -------------------------------------------------------------------------- */
/*                              RESOLVED VALUES                               */
/* -------------------------------------------------------------------------- */

/**
 * What `resolveDoc` writes in place of a `{ $collection }` / `{ $form }` ref.
 * Blocks accept either the ref (canvas, unresolved) or the resolved value.
 */
export const resolvedRecordSchema = z.object({
  id: z.string().min(1),
  slug: z.string().nullable().optional(),
  data: z.record(z.string(), z.unknown()),
  publishedAt: z.string().nullable().optional(),
  /** The record's own page — the collection's template page, base path
   *  included. Absent when the collection has no template page. */
  href: z.string().optional(),
});
export type ResolvedRecord = z.infer<typeof resolvedRecordSchema>;

export const resolvedCollectionSchema = z.object({
  $resolved: z.literal('collection'),
  collectionKey: z.string().min(1),
  delivery: collectionDeliverySchema,
  fields: z.array(fieldDocSchema),
  records: z.array(resolvedRecordSchema),
});
export type ResolvedCollection = z.infer<typeof resolvedCollectionSchema>;

export const resolvedFormSchema = z.object({
  $resolved: z.literal('form'),
  formKey: z.string().min(1),
  label: z.string(),
  collectionKey: z.string().min(1),
  fields: z.array(fieldDocSchema),
});
export type ResolvedForm = z.infer<typeof resolvedFormSchema>;

/* -------------------------------------------------------------------------- */
/*                            LIVE COLLECTION READS                           */
/* -------------------------------------------------------------------------- */

/**
 * `GET {recordsEndpoint}{collectionKey}?locale=&build=` — what a site reads
 * when a collection's delivery is `live` (series CB, CB-04). The endpoint
 * answers 404 unless the collection is live and not website-writable; a
 * `build` that names a preview build of the project adds Sandbox records,
 * anything else reads Live only.
 *
 * Records come back resolved the way the renderer resolves a frozen
 * collection for that locale, so a block draws them exactly as it draws its
 * first, frozen render.
 */
export const liveRecordsResponseSchema = z.object({
  data: z.object({
    collectionKey: z.string().min(1),
    environment: recordEnvironmentSchema,
    records: z.array(resolvedRecordSchema),
  }),
});
export type LiveRecordsResponse = z.infer<typeof liveRecordsResponseSchema>;

const FORMS_SEGMENT = '/public/forms/';
const RECORDS_SEGMENT = '/public/records/';

/**
 * The records base a site reads from, derived from the form base every
 * method already passes (`…/api/v1/public/forms/<projectId>/` →
 * `…/api/v1/public/records/<projectId>/`). Empty in, empty out: no endpoint
 * means no runtime read (the canvas, a draft).
 */
export function recordsEndpointFromFormEndpoint(formEndpoint: string): string {
  if (!formEndpoint.includes(FORMS_SEGMENT)) return '';
  return formEndpoint.replace(FORMS_SEGMENT, RECORDS_SEGMENT);
}

/** One collection's URL under a records base, with the locale and the build. */
export function liveRecordsUrl(
  recordsEndpoint: string,
  collectionKey: string,
  query: { locale: string; buildId?: string | null }
): string {
  if (recordsEndpoint === '') return '';
  const base = recordsEndpoint.endsWith('/') ? recordsEndpoint : `${recordsEndpoint}/`;
  const params = new URLSearchParams({ locale: query.locale });
  if (query.buildId) params.set('build', query.buildId);
  return `${base}${encodeURIComponent(collectionKey)}?${params.toString()}`;
}

/* -------------------------------------------------------------------------- */
/*                                ENVIRONMENTS                                */
/* -------------------------------------------------------------------------- */

const isLiveRecord = (record: RecordDoc) => (record.environment ?? 'production') === 'production';

/**
 * The records a build of `environment` may show. A snapshot freezes both
 * stores, and one version is built as a preview and then promoted to
 * production, so the filter belongs to whoever builds or serves it — never to
 * the version.
 *
 * - `production`: Live records only. Sandbox rows never reach a live site.
 * - `preview`: Live plus Sandbox. A Sandbox record whose slug a Live record
 *   already holds is dropped (the slug index is per environment), so a
 *   preview never has two records behind one URL. Live wins.
 *
 * Order is kept: the reader froze the records in the order the site shows.
 */
export function snapshotForEnvironment<T extends Pick<SiteSnapshot, 'records'>>(
  snapshot: T,
  environment: RecordEnvironment
): T {
  const records: SiteSnapshot['records'] = {};
  for (const [key, rows] of Object.entries(snapshot.records)) {
    if (environment === 'production') {
      records[key] = rows.filter(isLiveRecord);
      continue;
    }
    const liveSlugs = new Set(
      rows.filter(isLiveRecord).flatMap((row) => (row.slug ? [row.slug] : []))
    );
    records[key] = rows.filter(
      (row) => isLiveRecord(row) || !(row.slug && liveSlugs.has(row.slug))
    );
  }
  return { ...snapshot, records };
}

/* -------------------------------------------------------------------------- */
/*                                 MEDIA URLS                                 */
/* -------------------------------------------------------------------------- */

/**
 * `/api/v1/media/{projectId}/file/{assetId}` — the session-gated read the app
 * bakes into a snapshot. A trailing `?version=` is a cache key, not identity,
 * so it plays no part in the match.
 */
const MEDIA_FILE_URL = /^\/api\/v1\/media\/[^/?#]+\/file\/([^/?#]+)/;

/** The asset a session-gated media URL names, or `null` for any other URL. */
export function mediaFileUrlAssetId(url: string): string | null {
  const match = MEDIA_FILE_URL.exec(url);
  if (!match?.[1]) return null;
  /* A stored URL is whatever was stored. `decodeURIComponent` THROWS on a
     malformed escape (`%E0%A4%A`), and this runs over every `url` in a
     snapshot — one bad prop would take the whole published site down with a
     500. A URL that does not decode is not one of ours: leave it alone. */
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/**
 * Where an asset's bytes are in one context: `preset` absent → the original,
 * a preset → that rendition. `null` keeps an original's URL as it was, and
 * drops a rendition (a rung this context cannot serve is not offered).
 */
export type MediaUrlResolver = (assetId: string, preset?: MediaRenditionPreset) => string | null;

/** `url` with `name=value` set — on a root-relative URL too, and keeping its hash. */
export function withUrlParam(url: string, name: string, value: string): string {
  const hashAt = url.indexOf('#');
  const head = hashAt < 0 ? url : url.slice(0, hashAt);
  const hash = hashAt < 0 ? '' : url.slice(hashAt);
  const queryAt = head.indexOf('?');
  const path = queryAt < 0 ? head : head.slice(0, queryAt);
  const params = new URLSearchParams(queryAt < 0 ? '' : head.slice(queryAt + 1));
  params.set(name, value);
  return `${path}?${params.toString()}${hash}`;
}

/** An asset's ready rungs, each through `toUrl`; `undefined` when none survives. */
function renditionsVia(
  doc: MediaDoc | undefined,
  toUrl: (preset: MediaRenditionPreset) => string | null
): MediaRenditions | undefined {
  if (!doc?.renditions) return undefined;
  const out: MediaRenditions = {};
  for (const preset of MEDIA_RENDITION_PRESET_KEYS) {
    const ref = doc.renditions[preset];
    if (!ref) continue;
    const url = toUrl(preset);
    if (url) out[preset] = { ...ref, url };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * A media literal still pointing at the session-gated route (the editor, a
 * signed-in preview), given the ready rungs `snapshot.media` lists for its
 * asset — each at the literal's own URL plus `?r=<preset>`, so a pinned
 * `?version=` is kept. Anything else is returned as is: a literal that
 * already carries `renditions` (a rewritten snapshot), an external URL.
 */
export function withMediaRenditions<T extends ResolvedMedia>(
  media: T,
  docs: Readonly<Record<string, MediaDoc>>
): T {
  if (media.renditions) return media;
  const assetId = mediaFileUrlAssetId(media.url);
  const doc = assetId ? docs[assetId] : undefined;
  if (!doc) return media;
  const renditions = renditionsVia(doc, (preset) => withUrlParam(media.url, 'r', preset));
  return {
    ...media,
    ...(media.mime ? {} : { mime: doc.mime }),
    ...(renditions ? { renditions } : {}),
  };
}

function mapMediaUrls(
  value: unknown,
  resolve: MediaUrlResolver,
  docs: Readonly<Record<string, MediaDoc>>
): unknown {
  if (Array.isArray(value)) return value.map((item) => mapMediaUrls(item, resolve, docs));
  /* A URL as a plain string (a code variant's `data.logo`): no rungs to rebuild. */
  if (typeof value === 'string') {
    const assetId = mediaFileUrlAssetId(value);
    return (assetId ? resolve(assetId) : null) ?? value;
  }
  if (!isRecord(value)) return value;

  const assetId = typeof value.url === 'string' ? mediaFileUrlAssetId(value.url) : null;
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (assetId && key === 'renditions') continue;
    if (key === 'url' && typeof item === 'string') {
      next[key] = (assetId ? resolve(assetId) : null) ?? item;
      continue;
    }
    next[key] = mapMediaUrls(item, resolve, docs);
  }
  if (assetId) {
    /* A media value — an entry of `snapshot.media`, or a literal in a
       document: its rungs are rebuilt from the asset's own list, with this
       context's URLs. A rung the context has no URL for is dropped, never
       left pointing at the session-gated route. */
    const doc = docs[assetId];
    const renditions = renditionsVia(doc, (preset) => resolve(assetId, preset));
    if (renditions) next.renditions = renditions;
    if (doc && typeof next.mime !== 'string') next.mime = doc.mime;
  }
  return next;
}

/**
 * EVERY session-gated media URL in a snapshot, rewritten through `resolve` —
 * `snapshot.media`, and the literals inside page documents.
 *
 * Both matter, and rewriting only the first was a bug: a slot-bound image
 * resolves through `snapshot.media` at render time, but an image a designer
 * picks in the inspector is a literal `ResolvedMedia` in the block's props,
 * carrying a URL rather than an asset id. Left alone, that URL points at the
 * session-gated route, which answers `401` to the one viewer these rewrites
 * exist for — the visitor of a published site, and the holder of a share
 * link. A code variant's own props can name one as a plain string; it is
 * rewritten the same way. `resolve` returning null leaves a URL as it was.
 *
 * Every media value it rewrites also gets the asset's ready `renditions`
 *, each through `resolve(assetId, preset)`: the
 * published routes add `?r=<preset>`, a build points at its own copies.
 */
export function withResolvedMediaUrls<T extends SiteSnapshot>(
  snapshot: T,
  resolve: MediaUrlResolver
): T {
  /* It walks any JSON: page documents and components are covered too. */
  return mapMediaUrls(snapshot, resolve, snapshot.media) as T;
}
