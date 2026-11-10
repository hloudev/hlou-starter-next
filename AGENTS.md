# A Hlou site — read this before you change anything

This folder is a website built by **Hlou**, a control plane where an agency
designs, writes and publishes its clients' sites. Someone exported it (or
started it from this starter) so that a developer, you or the person you work
for, can build the site here and bring it back to Hlou. Part of the tree is
**Hlou's output**: edit it in the wrong place and the next compile or Hlou build
overwrites your work, or the import back into Hlou refuses it. This file says
where each kind of change belongs.

It is the canonical guide for every agent (Codex, Cursor, Copilot, Gemini,
Claude Code…). `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/hlou.mdc` and
`.github/copilot-instructions.md` only point here. Deeper notes, one topic each,
are in `.claude/skills/*/SKILL.md`; any agent may read them. Pages, content and
theme are written in the **site spec** (`hlou/site/`, skill `hlou-site-spec`).

## What this tree is

- A **Next.js 16** app (App Router, React 19, Tailwind CSS v4, next-intl 4,
  TypeScript strict, pnpm, Node 24) that builds to a **static export**:
  `output: "export"`, every page is a file in `out/`.
- `hlou/site/**` is the **site spec**: the site's pages, sections, canvas
  documents, theme, content per locale and collections, as keyed JSON files.
  **You write it.** `hlou/site.lock.json` beside it is generated: it maps each
  key to the row it came from in Hlou. Never edit the lock.
- `site/*` is **compiled output**: `site/snapshot.json` (pages, compositions,
  theme, media), `site/content.ts` (typed collections and records),
  `site/messages/<locale>.json` (site-wide copy). `pnpm hlou:compile` writes it
  from the spec; `pnpm dev` compiles the spec, recompiles on every change under
  `hlou/site/` and `public/media/`, and serves the result. Hlou's own build
  writes `site/` from the project's data. Nothing fetches content from Hlou.
- `renderer/` is **vendored**: a copy of Hlou's site renderer, stamped in
  `renderer/VERSION`. Every Hlou build replaces it, except the files someone
  hand-edited (those are kept as overlays). It also holds the spec's compiler
  and its JSON Schemas (`renderer/spec/`).
- `public/media/<dir>/<file>` holds the images and fonts. The spec names them
  by path (`/media/<dir>/<file>`); Hlou's **Media** library manages them.
- `hlou/export.json` (when present) is the export manifest: every file's class
  and hash at export time. It is how the import tells your changes from Hlou's.
- `custom/**` and `app/(custom)/**` are **the user zone** for code. Hlou never
  generates anything there (see `custom/README.md`).

## The zones

| Zone                | Paths                                                                                                                      | Rule                                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Edit freely**     | `hlou/site/**` (the spec), `custom/**`, `app/(custom)/**`, a `codeVariant` branch in `renderer/blocks/<key>/Component.tsx` | Yours. The spec is merged into the project on import; code is kept on every build and accepted by the import.                                          |
| **Edit with care**  | other `renderer/**`, `components/**`, `app/(site)/**`, `app/(redirects)/**`, `lib/**`, `i18n/**`                           | Accepted, but an edit wins over every later Hlou change to that file, so the site stops getting Hlou's fixes there. Prefer a variant or the user zone. |
| **Never edit**      | `site/**`, `hlou/site.lock.json`, `hlou/export.json`, `hlou/project.json`, the agent files listed above                    | Compiled from the spec, or regenerated on every export. The import refuses changes here.                                                               |
| **Never edit**      | `package.json`, the lockfile, `next.config.*`, `tsconfig.json`, `.env*`, `scripts/**`                                      | How the site is built: `scripts/spec-build.mjs` is the spec compiler that `pnpm dev`, `pnpm hlou:compile` and `prebuild` run. The import refuses them. |
| **Managed in Hlou** | the files already in `public/media/**`                                                                                     | New files are offered to the person importing as new Media assets. A changed existing file is refused: Media keeps the versions.                       |

## Where each kind of change belongs

| The request is about…                             | Where it goes                                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| copy: a title, a sentence, a translation, a price | the spec: `hlou/site/content/<locale>.json`, one file per locale (« Pages, contenu, thème » below).                 |
| pages and sections: add, remove, rename, reorder  | the spec: `hlou/site/pages/<slug>.json` (sections, slots, the canvas document).                                     |
| composition and theme: blocks, colours, fonts     | the spec: a page's `document`, and `hlou/site/site.json` › `theme`.                                                 |
| images, logos, fonts                              | a **new** file under `public/media/<dir>/`, named by its path in the spec. Replacing an existing one: Hlou › Media. |
| collections: fields and records                   | the spec: `hlou/site/collections/<key>.json`.                                                                       |
| the markup of one block, where no token can do it | a **`codeVariant`** branch in that block's `Component.tsx` (`.claude/skills/hlou-code-variant`).                    |
| a section no Hlou block draws                     | a **`custom` block** node in the page's document, drawn by a `codeVariant` of `renderer/blocks/custom/`.            |
| new logic: an API call, a widget, an extra page   | **the user zone**: `custom/**`, and pages in `app/(custom)/[locale]/…`.                                             |
| people, domains, publishing, form delivery        | **Hlou** only. Say so plainly.                                                                                      |

When a request mixes several of these, do each part where it belongs and **tell
the user plainly what is left for them in Hlou**. Never satisfy a copy request
by editing `site/*`, hardcoding the text in a component, or copying a block into
`components/`.

## Pages, contenu, thème

The site's structure, pages, documents, theme and content are written in
**`hlou/site/`**, never in `site/`. The skill `hlou-site-spec` has the tree, the
keys, the error codes and worked examples; the JSON Schemas are in
`renderer/spec/json-schema/`.

1. **Write the spec, not the output.** `hlou/site/pages/<slug>.json` for a page,
   its sections and its document; `hlou/site/content/<locale>.json` for the text
   and media of every slot, per locale; `hlou/site/site.json` for the locales,
   the theme, the header and footer; `hlou/site/collections/<key>.json` for
   collections.
2. **Run `pnpm hlou:compile` after each change and fix every error before
   moving on.** It prints `<file> at <path> [<code>] <message>` and leaves
   `site/` unchanged while the spec is invalid. Never edit `site/` or
   `scripts/` to silence it.
3. **Leave `hlou/site.lock.json` alone.** It maps keys to Hlou's rows; a key it
   does not know is a new row.
4. **Use Hlou's blocks only** (`renderer/blocks/index.ts`), with the props their
   `schema.ts` defines. Text that must be translated goes through a slot
   (`{ "$slot": "…" }`) with a value in every enabled locale's content file.
5. **What still belongs in Hlou**: people and access, domains, publishing, where
   form submissions are delivered, the agency library, and replacing a medium
   Hlou already has.

### A worked example (FR site)

> « Ajoute une bannière « Offre d'été » au-dessus de la liste des chambres, et
> une page /agences qui affiche nos agences depuis https://api.example.com/agences. »

1. **The banner** is a new section on a Hlou page, so it goes in the spec: in
   `hlou/site/pages/rooms.json`, a section `summer-offer` with its slots, and a
   `ctaBand` node above the listings bound to them; its text in
   `hlou/site/content/fr.json` and every other locale's file. Run
   `pnpm hlou:compile`. If no block can draw it as wanted, make the node a
   `custom` block with `codeVariant: "custom:offre"` and add that branch to
   `renderer/blocks/custom/Component.tsx` (skill `hlou-code-variant`).
2. **The API**: a typed client in `custom/api/client.ts`, a client component in
   `custom/components/`, and the page at `app/(custom)/[locale]/agences/page.tsx`.
   The recipes are in `custom/README.md`.
3. **Say what is left**: importing the folder back into Hlou, and publishing.

## Static export: what can and cannot run

Hlou hosts **`output: "export"` only**: plain files on a CDN, no server.

- **No server code.** No route handlers (`app/**/route.ts`), server actions
  (`"use server"`), middleware or `proxy.ts`, `headers()` / `cookies()`, ISR or
  on-demand revalidation. They fail the export.
- **Client-side calls are fine**: `fetch` from a client component, a REST or
  GraphQL client, Supabase-js, all with keys that are **public by design**
  (an anon or publishable key, never a secret: everything ships to browsers).
- **Configuration is code.** Hlou's build writes its own `.env.local`; your env
  variables never reach it. Put public settings as constants in
  `custom/config.ts`.
- **No new dependencies.** `package.json` and the lockfile are Hlou's. Use
  `fetch`, `zod` and `motion` (already installed). If a package is truly
  needed, stop and tell the user: accepting it is an explicit « adopt the build
  configuration » decision on import, not yours.
- **Leaving static export means leaving Hlou's hosting.** Removing
  `output: "export"` (to get a server) is possible only if the site is then
  hosted elsewhere; the import refuses `next.config.*` changes.

## Animation

- **A block's motion is data.** How it appears, its hover and press, a loop, a
  scroll effect, a text cascade: `style.motion` (or `elements.<name>.motion`)
  on its node in the page's document, with presets by name
  (`{ "enter": { "preset": "rise" } }`; the values are in
  `renderer/spec/json-schema/`). One small script plays it on every page, at
  the site's pace (its motion personality, in the theme), and visitors who ask
  for reduced motion get a short fade. Prefer it to code, always.
- **Restraint**: one appear preset for the whole page, a list or a grid
  staggered from its block (`"stagger": { "each": 0.08 }`), no loop on text.
- **Motion code** only for what the spec cannot express (a scroll-linked
  composition, a sequence across elements): `motion`, `motion/react` and
  `motion/react-client` are installed, for `custom/**` and `codeVariant`
  branches. Recipe 3 of `custom/README.md`. The first frame must be the
  complete content, and `useReducedMotion()` gets a still version. No other
  animation package; no Motion+ APIs.

## Forms

Hlou's `form` block posts `{ formKey, locale, data }` to Hlou's public forms
API, `${NEXT_PUBLIC_HLOU_API_URL}/api/v1/public/forms/${NEXT_PUBLIC_HLOU_PROJECT_ID}/`
(`lib/forms.ts`). Submissions land in Hlou's inbox. A form is declared in a
collection's `forms` (`hlou/site/collections/<key>.json`) and placed with
`{ "$form": "<key>" }`; where its submissions are delivered is set in Hlou.
Post somewhere else from a `codeVariant` of `renderer/blocks/form/Component.tsx`;
your own forms in the user zone may use `submitForm()` from `lib/forms.ts`.

## Running it

```bash
cp .env.example .env.local   # the export fills it with this project's values
pnpm install
pnpm dev                     # compiles hlou/site/ and watches it; http://localhost:3000 → /fr/ (the source locale)
pnpm hlou:compile            # checks the spec and writes site/ once
pnpm build && pnpm preview   # the static export (prebuild compiles the spec), on http://localhost:4173
pnpm hlou:pack               # the zip to import into Hlou (checks the spec first)
pnpm check-types && pnpm lint
```

`pnpm hlou:compile` and `pnpm check-types` must pass before you hand the folder
back. Without `hlou/site/site.json` there is no spec: `pnpm dev` then serves
`site/` as it is.

## Conventions

- Locales come from the spec (`hlou/site/site.json`); the source locale is the
  default and every page lives under `/<locale>/`. Arabic renders `dir="rtl"`:
  use logical utilities only (`ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`,
  `text-start`), never `ml-`, `pl-`, `left-`, `text-left`.
- Style with Tailwind and the site tokens so the theme keeps driving the look:
  `bg-site-paper`, `text-site-ink`, `bg-site-accent`, `text-site-xl`,
  `font-heading`, `rounded-site`, `max-w-site-content`. Breakpoints `md` 768,
  `lg` 1180, `xl` 1440 (`.claude/skills/hlou-blocks`).
- Read records through `site/content.ts` (`records`, `pick`, `getBySlug`);
  never copy their text into code (`.claude/skills/hlou-content-contract`).
  The records themselves are written in `hlou/site/collections/<key>.json`.
- No `any` (prefer `unknown` + narrowing), no secrets in the tree.

## Coming back to Hlou

`pnpm hlou:pack` zips the folder the way Hlou reads it (`<name>.hlou.zip`,
without `node_modules`, `.next`, `out`). A folder exported from a project goes
back into it, `site/` included as the export wrote it: the project's **Réglages
› Export et import › Importer dans ce projet**. A folder started from the
starter (no `hlou/export.json`) becomes a new project: **Nouveau projet ›
Importer**; there `hlou:pack` checks the spec first and leaves `site/` out. Hlou
shows a report before anything is applied:

- **The spec** (`hlou/site/**`) is merged with what changed in Hlou since the
  export, field by field. Changed on one side only: that side wins. Changed on
  both: **Hlou's value wins unless you choose yours in the report**, item by
  item.
- **Applied**: changed and new files in the editable code zones, kept as overlays.
- **Refused**, file by file: changes to `site/**`, `hlou/site.lock.json`,
  `hlou/export.json`, `package.json`, the lockfile, `next.config.*`; deleting a
  generated file; a changed image; a block, prop, locale or media path Hlou
  cannot honour; more than 200 overlay files or a file over 256 KB.
- **Offered**: new images in `public/media/`, as new Media assets.
- **Ignored**: the agent files (`AGENTS.md`, `CLAUDE.md`, `.claude/**`…),
  regenerated on every export.

The full rules are in `.claude/skills/hlou-roundtrip`.

## Avec le serveur MCP de Hlou

When this session is connected to Hlou's MCP server (`site_spec_*` tools), the
spec goes back and forth with no zip:

1. **Get** — `site_spec_get` (with the project's shortId): write every file it
   returns under `hlou/`, the lock included, as it is. Files too large to
   inline are read with `version` + `path`. Download each `mediaFiles` entry's
   `url` to its `file` (`public/media/…`, the link lasts an hour): the
   project's media, so `pnpm hlou:compile` and `pnpm dev` find them. They are
   already in Hlou: never upload them again.
2. **Edit and check** — change `hlou/site/**` as above; `site_spec_validate`
   and `pnpm hlou:compile` until there is no error.
3. **Plan** — `site_spec_plan` with every `hlou/site/**` file and the lock, plus
   the paths of new files in `public/media/`. PUT each new file to its
   `uploadUrl`.
4. **Show the person the plan** — the changes, and each conflict with Hlou's
   value and yours (Hlou's is kept unless they choose yours). Fix any refusal
   and plan again.
5. **Apply on their word only** — `site_spec_apply` with the `planId` and the
   conflict ids they chose to resolve to the spec (`keepLocal`). It is one
   change in Hlou, undoable from the project's agent history. If Hlou moved
   since the plan, plan again.

<!-- hlou:project -->
<!-- The export writes this project's facts here (pages and their spec files, locales, blocks in use). Leave both markers in place. -->
<!-- /hlou:project -->
