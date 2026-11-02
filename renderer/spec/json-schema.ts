/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { siteSpecLockSchema } from './lock';
import {
  siteSpecCollectionSchema,
  siteSpecContentSchema,
  siteSpecPageSchema,
  siteSpecSiteSchema,
} from './schema';

/* -------------------------------------------------------------------------- */
/*                                 JSON SCHEMA                                */
/* -------------------------------------------------------------------------- */

/**
 * One JSON Schema per kind of spec file, for editors and tools without Zod.
 * Hlou generates them into
 * `./json-schema/<kind>.schema.json` (vendored with the renderer, so a
 * starter's editor finds them offline at `renderer/spec/json-schema/`), and a
 * test keeps them current. Structure only: references, block props and media
 * are `validateSiteSpec`'s.
 */
export const SITE_SPEC_JSON_SCHEMA_KINDS = [
  'site',
  'page',
  'content',
  'collection',
  'lock',
] as const;
export type SiteSpecJsonSchemaKind = (typeof SITE_SPEC_JSON_SCHEMA_KINDS)[number];

/** Where each generated schema says it lives. */
export function siteSpecSchemaId(kind: SiteSpecJsonSchemaKind): string {
  return `https://hlou.app/schemas/site-spec/v1/${kind}.schema.json`;
}

/** The file each schema is committed as, relative to this folder. */
export function siteSpecSchemaFile(kind: SiteSpecJsonSchemaKind): string {
  return `json-schema/${kind}.schema.json`;
}

const SOURCES: Record<SiteSpecJsonSchemaKind, { schema: z.ZodType; title: string }> = {
  site: { schema: siteSpecSiteSchema, title: 'Hlou site spec, format 1: hlou/site/site.json' },
  page: {
    schema: siteSpecPageSchema,
    title: 'Hlou site spec, format 1: hlou/site/pages/<slug>.json',
  },
  content: {
    schema: siteSpecContentSchema,
    title: 'Hlou site spec, format 1: hlou/site/content/<locale>.json',
  },
  collection: {
    schema: siteSpecCollectionSchema,
    title: 'Hlou site spec, format 1: hlou/site/collections/<key>.json',
  },
  lock: {
    schema: siteSpecLockSchema,
    title: 'Hlou site spec lock, format 1: hlou/site.lock.json (generated, read-only)',
  },
};

/** The input side of one file's schema, as JSON Schema draft 2020-12. */
export function siteSpecJsonSchema(kind: SiteSpecJsonSchemaKind): Record<string, unknown> {
  const { schema, title } = SOURCES[kind];
  const { $schema, ...rest } = z.toJSONSchema(schema, {
    io: 'input',
    target: 'draft-2020-12',
  });
  return { $schema, $id: siteSpecSchemaId(kind), title, ...rest };
}

/** Every kind's schema, by kind. */
export function siteSpecJsonSchemas(): Record<SiteSpecJsonSchemaKind, Record<string, unknown>> {
  return Object.fromEntries(
    SITE_SPEC_JSON_SCHEMA_KINDS.map((kind) => [kind, siteSpecJsonSchema(kind)])
  ) as Record<SiteSpecJsonSchemaKind, Record<string, unknown>>;
}
