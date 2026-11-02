---
name: hlou-site-anatomy
description: The layout of a Hlou site folder — what each folder is (hlou/site/ the spec you write, site/ compiled from it, renderer/ vendored, public/media the media, custom/ the user zone), what pnpm dev reads and compiles, and why renderer/VERSION exists. Use when first orienting in this repository, before creating or moving files, or when unsure whether a file is safe to edit.
---

# Anatomy of a Hlou site

The tree is a Next.js 16 static export. You write the **spec** (`hlou/site/`)
and the user zone; the rest is compiled from the spec, vendored from Hlou, or
the starter's own wiring.

| Path                           | Who writes it                         | What it is                                                                                                                                                        |
| ------------------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hlou/site/**`                 | **you** (and Hlou's export)           | The site spec: pages, sections, documents, theme, content per locale, collections (skill `hlou-site-spec`)                                                        |
| `hlou/site.lock.json`          | the export                            | Every spec key → the uuid it had in Hlou. Never edit                                                                                                              |
| `site/snapshot.json`           | `pnpm hlou:compile`, or Hlou's build  | Pages, their compositions (doc v2 node trees), header/footer components, theme, media, settings                                                                   |
| `site/content.ts`              | `pnpm hlou:compile`, or Hlou's build  | Collections as typed records, `Localized<T>`, `pick`, `getBySlug`                                                                                                 |
| `site/messages/<locale>.json`  | `pnpm hlou:compile`, or Hlou's build  | Site-wide copy (`site.logo`, …) per locale                                                                                                                        |
| `site/tw-classes.txt`          | `pnpm hlou:compile`, or Hlou's build  | The Tailwind utilities the stored styles use                                                                                                                      |
| `renderer/`                    | Hlou (vendored)                       | Every block, the doc renderer, the chrome (head, sitemap, 404), the spec compiler and its JSON Schemas (`renderer/spec/`). `renderer/VERSION` is its content hash |
| `public/media/<dir>/<file>`    | Hlou Media, or you (new files only)   | Images and fonts; the spec names them `/media/<dir>/<file>`                                                                                                       |
| `hlou/export.json`             | the export                            | Every file's class and sha256 when it left Hlou                                                                                                                   |
| `scripts/spec-build.mjs`       | the starter                           | The spec compiler `pnpm dev`, `pnpm hlou:compile` and `prebuild` run                                                                                              |
| `app/(site)/[locale]/…`        | the starter                           | Thin adapters: the root layout and the one catch-all page that renders every Hlou page with `SiteRender`                                                          |
| `app/(redirects)/…`            | the starter                           | Stubs forwarding `/` and unprefixed page paths to the source locale                                                                                               |
| `components/`, `lib/`, `i18n/` | the starter                           | `MainLayout`, `SiteFrame`, the snapshot reader, the env, forms, locale routing                                                                                    |
| `custom/**`, `app/(custom)/**` | **you**                               | The user zone for code. Never generated, always kept                                                                                                              |

## What `pnpm dev` does

With a spec (`hlou/site/site.json` exists), `pnpm dev` first compiles it into
`site/` (`scripts/spec-build.mjs`), recompiles on every change under
`hlou/site/` and `public/media/`, and runs `next dev`. An invalid spec prints
its errors and leaves `site/` as it was. Without a spec it serves `site/` as it
is. Nothing comes from the network.

Then `lib/snapshot.ts` validates `site/snapshot.json` against the renderer's Zod
schema once; `i18n/routing.ts` takes the locales from it (the `isSource` one is
the default, `dir: "rtl"` marks Arabic); `app/(site)/[locale]/[[...slug]]/page.tsx`
lists every route with `siteRoutes(snapshot)` and draws each page with
`SiteRender`. Draft pages are not routed. Collection pages (`/rooms/[slug]`)
get one static page per published record.

Inside Hlou's builder (`HLOU_BUILDER=1`) the spec is never compiled: Hlou
writes `site/` from the project's data.

## Why `renderer/VERSION`

Each Hlou build copies a fresh renderer over this folder. `VERSION` is the
digest of that copy, so the import can tell which renderer your edits started
from. Hand edits to `renderer/` files survive as overlays, but an edited file
stops receiving Hlou's fixes, which is why the sanctioned edit is a
`codeVariant` branch (skill `hlou-code-variant`) and new code goes to the user
zone.

## Rules that follow

- Structure, pages, theme and content: edit `hlou/site/**`, then run
  `pnpm hlou:compile` (skill `hlou-site-spec`).
- Never edit `site/**`, `hlou/site.lock.json`, `hlou/export.json`,
  `package.json`, the lockfile, `next.config.*`, `tsconfig.json`, `.env*` or
  `scripts/**`.
- Do not copy a block into `components/` to restyle it: a page never renders it
  from there. Use a variant.
- Do not hardcode copy in code; write it in the spec's content files and read
  it through the block's props or `site/content.ts` (skill
  `hlou-content-contract`).
