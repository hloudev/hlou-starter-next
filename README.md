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

## Reference

### Stack

Next.js 16 (App Router, static export) · React 19 · Tailwind CSS v4 (CSS-first, no
`tailwind.config`) · next-intl 4 · zod 4 · TypeScript strict · pnpm 10, Node 24.

Every block's look is Tailwind utilities in its component
(`renderer/blocks/*/Component.tsx`). `renderer/styles/tailwind.css` brings the site
tokens (`bg-site-paper`, `text-site-xl`, `font-heading`) and the breakpoints (`md` 768,
`lg` 1180, `xl` 1440).

### Scripts

```bash
pnpm dev              # compiles hlou/site/ when there is one, watches it; http://localhost:3000
pnpm hlou:compile     # checks the spec and writes site/
pnpm hlou:pack        # the zip Hlou imports
pnpm build            # static export → out/ (compiles the spec, renders public/og.png)
pnpm preview          # serves out/ on http://localhost:4173
pnpm lint             # eslint
pnpm format           # prettier --write .
pnpm check-types      # tsc --noEmit
pnpm optimise-images  # a sharp ladder over public/media
```

### Structure

```
AGENTS.md · CLAUDE.md · GEMINI.md · .cursor/ · .github/ · .claude/skills/   the agent kit
hlou/site/   the site spec: yours
custom/      the user zone: yours
app/         (site)/[locale] pages · (redirects) `/` and unprefixed paths → the source locale · thin adapters onto Next
components/  the page frame · ui/ · icons/
i18n/        routing · request · navigation · messages/{fr,en,ar}.json
lib/         the validated snapshot · env · forms · analytics
renderer/    Hlou's blocks and chrome, vendored: never edit it, a build replaces it
site/        generated from the spec: never edit it
public/media/ images and fonts
scripts/     spec-build · pack · og-image · serve-out · optimise-images
```

To change how a block draws, add a `codeVariant` branch to its `Component.tsx` (skill
`hlou-code-variant`); every Hlou build keeps it. The `renderer/` imports only `react` and
`zod`, and its styles read only `--site-*` variables.

### What `site/` holds

| File                          | Content                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `site/snapshot.json`          | The compiled site, read through `lib/snapshot.ts`                                                            |
| `site/content.ts`             | `locales`, `defaultLocale`, one interface per collection, `records` (published), `pick`, `getBySlug`         |
| `site/messages/<locale>.json` | The text of the site-wide slots, read as `t("Site.site.logo")`                                               |
| `site/tw-classes.txt`         | The utilities the spec's stored styles use                                                                   |

Your own pages read records through `site/content.ts` (`pick(value, locale)`,
`getBySlug("rooms", slug)`) and never fetch them. Locales are not hardcoded: `i18n/routing.ts`
reads them from the snapshot. Copy you add yourself goes in `i18n/messages/<locale>.json`, in
every locale, using logical CSS properties so the site works under `dir="rtl"`.

### Running the sample

The committed `site/` is a sample (`Dar Zitouna`: fr source, en, ar RTL; `rooms` and `journal`
collections; a `booking` form) with placeholder JPEGs under `public/media`.
`cp .env.example .env.local`, `pnpm install`, `pnpm dev`.

### Deployment

`pnpm build` writes a static site to `out/`, which any static host can serve. Set
`NEXT_PUBLIC_SITE_URL` to the canonical origin: it feeds canonicals, hreflang, the sitemap,
robots and JSON-LD. `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (optional) adds Plausible.

## License

[MIT](./LICENSE) © EMIKETIC
