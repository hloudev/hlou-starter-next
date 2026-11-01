# hlou-starter-next

**Hlou** is where an agency designs, writes, translates, reviews and hosts its
clients' websites. This starter is the Next.js template every Hlou site is built
from — and the place to start one on your own machine, with your own coding
agent, before the Hlou project exists.

You write the site as a **site spec**: keyed JSON files in `hlou/site/` (pages,
sections, theme, content per locale, collections). `pnpm dev` renders it exactly
as Hlou will. When it is ready, Hlou takes it in as a new project.

## Quick start

```bash
npm create hlou-site@latest my-site   # asks for the name and the locales
cd my-site
pnpm install                          # pnpm 10, Node 24
pnpm dev                              # http://localhost:3000
```

Or clone this repository: without `hlou/site/`, `pnpm dev` serves the committed
sample (`site/`), a guest house in French, English and Arabic.

Then open the folder in Claude Code (or Codex, Cursor, Copilot, Gemini) and ask
for pages. [`AGENTS.md`](./AGENTS.md) and `.claude/skills/` teach any agent the
spec, the blocks and the rules; Hlou's Figma plugin turns a Figma frame into spec
files:

```text
/plugin marketplace add hloudev/hlou-claude-plugins
/plugin install hlou-figma-handoff@hlou-claude-plugins
```

## The spec in five minutes

```
hlou/site/
  site.json               format, source locale and locales, theme, header/footer, site-wide slots
  pages/<slug>.json       one page: path, title, sections and their slots, the canvas document
  content/<locale>.json   the text and media of every slot, one file per locale
  collections/<key>.json  a collection's fields, records and forms
public/media/<dir>/<file> images and fonts, named in the spec by /media/<dir>/<file>
```

- **Keys, never ids.** A page is its slug, a section and a slot their key, a
  medium its path. Copy reaches a page through a slot: `{ "$slot": "hero.title" }`
  in the page's document, and `"home/hero.title": { "kind": "text", "text": "…" }`
  in each locale's content file.
- **Hlou's blocks only** (`renderer/blocks/`), with the props their `schema.ts`
  defines. A node with partial props takes the block's defaults.
- **`pnpm hlou:compile` checks everything** and prints
  `<file> at <path> [<code>] <message>`; `pnpm dev` and `pnpm build` run it.
  JSON Schemas for your editor are in `renderer/spec/json-schema/`.

The full reference, with worked examples, is the skill
[`hlou-site-spec`](./.claude/skills/hlou-site-spec/SKILL.md).

## Bring it to Hlou

- **A new project — the zip.** `pnpm hlou:pack` checks the spec and writes
  `<name>.hlou.zip` (without `node_modules`, `.next`, `out`, the compiled
  `site/`, or anything `.gitignore` ignores). In Hlou: **New project › Import**, drop the archive.
  Hlou shows what it will create — pages, content per locale, media, your code —
  and refuses nothing silently: a block, locale or media path it cannot honour
  is listed before anything is created.
- **An existing project — the MCP.** Connect your agent to Hlou's MCP server;
  the `site_spec_get`, `site_spec_validate`, `site_spec_plan` and
  `site_spec_apply` tools read the project's spec, check yours, show the plan
  (Hlou's value wins a conflict unless you pick yours) and apply it as one
  change you can undo. [`AGENTS.md`](./AGENTS.md) « Avec le serveur MCP de Hlou »
  has the steps.

Hlou's help explains both: [Working outside Hlou](https://help.hlou.site/en/guides/portability/work-outside).
New to Hlou as a developer? Start with the
[developer's getting-started guide](https://help.hlou.site/en/getting-started/by-role/developer).

## The user zone

`custom/**` and `app/(custom)/**` are yours: an API client, a widget, an extra
page. Hlou never writes there, and the import keeps them as the project's own
code. The recipes are in [`custom/README.md`](./custom/README.md). To change how
one block draws, add a `codeVariant` branch to its component (skill
`hlou-code-variant`).

## What Hlou builds, and what it ignores

Hlou builds every site from **its own copy** of this starter, at the commit it
pins, from the project's data. What a new project takes from your folder:

| Comes in                                 | Ignored                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `hlou/site/**` — merged into the project | `site/**`, compiled from the spec (Hlou compiles its own)               |
| new files in `public/media/` — as Media  | `renderer/**`, `app/(site)/**`, `components/**`, `lib/**` — Hlou's copy |
| `custom/**`, `app/(custom)/**` — as code | `package.json`, the lockfile, `next.config.*`, `scripts/**`, `.env*`    |
|                                          | the agent files (`AGENTS.md`, `CLAUDE.md`, `.claude/**`…)               |

A folder exported from a Hlou project goes back through that project's own
import, which also accepts careful edits elsewhere (« The zones » in
[`AGENTS.md`](./AGENTS.md)). Sites are static exports (`output: "export"`): no server code, no route
handlers, no secrets — see « Static export » in [`AGENTS.md`](./AGENTS.md).

## License

[MIT](./LICENSE) © EMIKETIC. The rest of this file is for the people who
maintain the starter in the Hlou monorepo.

## Maintaining the starter

A build copies this tree, drops the project's `site/*` and media in, and runs
`next build` — so everything here must work standalone (clone → `pnpm dev`)
and must consume only what the builder writes.

### Stack

- **Next.js 16** — App Router, static export (`output: "export"`,
  `trailingSlash: true`, unoptimized images)
- **React 19**
- **Tailwind CSS v4** — CSS-first (`@import "tailwindcss"` in
  `app/globals.css`, `@tailwindcss/postcss`, no `tailwind.config`). It styles
  the starter's chrome and the rendered blocks alike: every block's look is
  utilities in its component (`renderer/blocks/*/Component.tsx`), and
  `renderer/styles/tailwind.css` brings the site tokens (`bg-site-paper`,
  `text-site-xl`, `font-heading`) and the breakpoints (`md` 768, `lg` 1180,
  `xl` 1440). `site/tw-classes.txt` (written by the Hlou builder) lists the
  utilities the site's stored styles use. `renderer/styles/site.css` is only a
  base (scope tokens, the theme's density padding, rich-text prose), in the
  `hl-site` layer below `utilities` — a class you add always wins.
- **next-intl 4** — `[locale]` segment, static params, no `requestLocale`
- **zod 4** — with `react`, the renderer's only dependency
- **TypeScript** strict, `@/*` → repo root (flat layout, no `src/`)
- **pnpm 10.32**, Node 24. Prettier (+ tailwind plugin), ESLint flat config
  (`eslint-config-next/core-web-vitals` + `/typescript`)

### Scripts

```bash
pnpm dev              # compiles hlou/site/ when there is one, watches it; http://localhost:3000
pnpm hlou:compile     # checks the spec and writes site/ (scripts/spec-build.mjs)
pnpm hlou:pack        # the zip Hlou imports (scripts/pack.mjs)
pnpm build            # static export → out/ (prebuild compiles the spec, renders public/og.png)
pnpm start            # next start (not used for the export; prefer preview)
pnpm preview          # serve out/ on http://localhost:4173 (scripts/serve-out.mjs)
pnpm lint             # eslint
pnpm format           # prettier --write .
pnpm check-types      # tsc --noEmit
pnpm optimise-images  # sharp ladder over public/media (scripts/optimise-images.mjs)
```

`.claude/launch.json` declares `dev` (3000) and `preview` (4173).

### i18n

Locales are **not** hardcoded: `i18n/routing.ts` reads `site/snapshot.json`
(`locales[]`, the `isSource` one is the default, `dir: "rtl"` marks RTL) and
exports `routing`, `rtlLocales`, `getDir(locale)`, `isLocale()`.
`i18n/request.ts` avoids `await requestLocale` (it needs `headers()`, which
breaks the export) and merges two message sources:

- `i18n/messages/<locale>.json` — copy the starter adds of its own, FR first.
  A locale without a file falls back to the default. The chrome's copy (skip
  link, redirects, 404) is the renderer's, in `renderer/site/messages.ts`.
- `site/messages/<locale>.json` — written by the builder: a flat
  `{ "site.logo": "…" }` map of the site slots. Dots are illegal in next-intl
  keys, so the map is unflattened under `Site`: `t("Site.site.logo")`.

**The chrome is the renderer's** (`renderer/site/*`, Hlou decision 113): the
document head (`siteDocument`, `layoutMetadata`, `pageMetadata`,
`siteViewport`), routes (`siteRoutes`, `resolveRoute`), JSON-LD, sitemap,
robots, manifest, redirect stubs, the skip link, the 404 and the social card.
The files under `app/` are thin adapters onto Next's `Metadata` and file
conventions; the `kernel` build method renders the same functions without
Next, and a parity test in the Hlou repo compares the two outputs. Change the
chrome in `packages/site-renderer/src/site`, never here. Root layouts import
`@/renderer/site/<module>`, not `@/renderer`: the barrel would pull the form's
client chunk into every page.

Routes live under `app/(site)/[locale]/`. `<html lang dir>` is set per locale
by that layout — a root `app/layout.tsx` cannot read the segment, so the route
groups each own a root layout (`(site)` for pages, `(redirects)` for the stubs
that forward `/` and unprefixed paths to the default locale, and an exported
site's `(custom)` pages, which reuse the `(site)` layout).

### Structure

```
AGENTS.md · CLAUDE.md · GEMINI.md · .cursor/ · .github/ · .claude/skills/   the agent kit (Hlou decision 185)
app/
  (site)/[locale]/layout.tsx          root layout: adapts siteHtmlAttrs, layoutMetadata, siteViewport
  (site)/[locale]/[[...slug]]/page.tsx generateStaticParams = siteRoutes(snapshot); SiteRender + pageJsonLd
  (redirects)/…                       `/` and `/rooms` → `/fr/`, `/fr/rooms/` (query kept; `<noscript>` meta refresh without JS)
  not-found.tsx · sitemap.ts · robots.ts · manifest.ts · icon.svg · favicon.ico
  globals.css                         Tailwind, then renderer/styles/{site,tailwind}.css, site/tw-classes.txt; focus rules
components/  MainLayout · RedirectStub (async adapters over SiteChrome / RedirectBody) · SiteFrame · ui/{Container,Button,Eyebrow} · icons/
custom/      the user zone of an exported site — only its README ships; Hlou never writes here
i18n/        routing · request · navigation · messages/{fr,en,ar}.json
lib/         snapshot (validated site/snapshot.json) · site (SiteEnv from NEXT_PUBLIC_*) · forms · analytics
renderer/    VENDORED — never edit here (see below)
site/        GENERATED — never edit here (see below)
public/media/<assetId>/<file>         copied in by the builder; placeholders committed for the sample
scripts/     spec-build (hlou:compile, dev, prebuild) · pack (hlou:pack) · og-image (prebuild: renderer's ogImage → next/og → public/og.png) · serve-out · optimise-images · fixture-from-renderer
.github/workflows/ci.yml           install, compile, build on the sample and on the empty spec, pack
```

### The agent kit

`AGENTS.md` is canonical and stays under 250 lines; the other agent files are
shims of at most 10 lines that point at it, and `CLAUDE.md` adds at most 15
lines of Claude notes. The export (`feature-code`'s export archive) replaces
everything between the `<!-- hlou:project -->` and `<!-- /hlou:project -->`
markers with the project's facts — keep both markers. The import ignores every
agent file, since each export regenerates them. The kit is prose, so its test
is behaviour: after a change, run a fresh Claude Code session and a Codex or
Cursor session on an exported tree with the M36-02 prompt, and record the
outcome in `docs/handoffs/portability/PROGRESS.md`.

### `renderer/` is vendored

A byte-for-byte copy of `packages/site-renderer/src` from the Hlou monorepo
(minus fixtures and tests), stamped in `renderer/VERSION`. It changes only via
`pnpm sync:renderer` at the monorepo root (`sync:renderer:check` fails CI on
drift); the builder re-syncs before every build. It imports nothing from
`@hlou/*` — only `react` and `zod`. Its styles live under `.hl-site-scope` and
read only `--site-*` variables: `grep -r -- "--hl-\|--mantine-" out/` must find
nothing. A site restyles a block through a `codeVariant` branch in its
`Component.tsx` (Hlou decision 106), which every build keeps as an overlay.

### `site/` is generated (the builder contract)

`apps/builder/src/materialise.ts` copies the starter (ignoring `/site`,
`/.env.local`, `/public/media`) and writes:

| File                            | Content                                                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `site/snapshot.json`            | The `SiteSnapshot` (`renderer/contracts`), media URLs rewritten to `/media/<assetId>/<file>`                                     |
| `site/content.ts`               | `locales`, `defaultLocale`, `Localized<T>`, `MediaRef`, one interface per collection, `records` (published), `pick`, `getBySlug` |
| `site/messages/<locale>.json`   | Flat `{ "<slot.key>": "<text>" }` of the site slots for that locale                                                              |
| `public/media/<assetId>/<file>` | Every asset in `snapshot.media`                                                                                                  |
| `.env.local`                    | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_HLOU_API_URL`, `NEXT_PUBLIC_HLOU_PROJECT_ID`                                                |

`lib/snapshot.ts` validates `site/snapshot.json` once with `siteSnapshotSchema`
and is the only reader of it on the server; `i18n/routing.ts` reads the JSON
directly because it also runs on the client. Page code reads records through
`site/content.ts` (`pick(value, locale)`, `getBySlug("rooms", slug)`) — never
fetches.

Forms: the renderer's form block posts
`{ formKey, locale, data }` to the `formEndpoint` the page passes, built by
`lib/forms.ts` as `${NEXT_PUBLIC_HLOU_API_URL}/api/v1/public/forms/${NEXT_PUBLIC_HLOU_PROJECT_ID}/`.
`lib/forms.ts` also exposes `submitForm()` (honeypot field `website`) for the
starter's own forms.

### Running standalone on the fixture

The committed `site/` is the renderer's fixture (`Dar Zitouna`: fr source,
en, ar RTL; `rooms` + `journal` collections; a `booking` form) with placeholder
JPEGs under `public/media`. `cp .env.example .env.local`, `pnpm install`,
`pnpm dev`. To regenerate the sample from the monorepo root (it needs the
fixture and the builder's generator, neither vendored):

```bash
node_modules/.bin/tsx hlou-starter-next/scripts/fixture-from-renderer.mts
```

The script calls the builder's own functions (`siteSnapshotSchema`,
`mediaFileName`, `withResolvedMediaUrls`, `renderContentTs`, `siteStyleClasses`,
`snapshotSiteMessages`), so a re-run must reproduce the committed `site/`
exactly — a diff means the fixture or the builder changed, never the sample.
Message files fall back to the source locale per slot (`en.json` carries the
French `site.legal` because the fixture has no English one).

### Deployment

`pnpm build` → `out/` (`fr/index.html`, `fr/rooms/jasmin/index.html`,
`sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `og.png`, `404.html`).
`prebuild` renders `public/og.png` (the default social card: site name,
description, theme colours) with `next/og` — a file-convention
`opengraph-image.tsx` exports without an extension under `output: "export"`,
which static hosts then serve without an image content-type. Any static host;
the builder's `DeployTarget` is Cloudflare Workers Static Assets
(`html_handling: auto-trailing-slash`) or the local static server. Set
`NEXT_PUBLIC_SITE_URL` to the canonical origin — it feeds `metadataBase`,
canonicals, hreflang, the sitemap, robots and JSON-LD.
`NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (optional) injects Plausible.

### Notes

- Fonts: resolved at runtime by the renderer's `SiteRoot` (a Google Fonts
  `<link>` or `@font-face` for an uploaded file) from whatever the theme
  names; `themeToCss()` writes `--site-heading-font` / `--site-body-font`.
  No `next/font` — self-hosting is a deferred optimisation.
- Literal hrefs in block props (`/rooms`) are not locale-prefixed by the
  renderer (only page-id derived ones are); the `(redirects)` stubs forward
  them to the default locale.
- No `any`; prefer `unknown` + narrowing. No hardcoded copy — the chrome's is
  the renderer's; anything the starter adds goes in all of
  `i18n/messages/{fr,en,ar}.json`. Logical CSS properties only; the
  site renders under `dir="rtl"`.
