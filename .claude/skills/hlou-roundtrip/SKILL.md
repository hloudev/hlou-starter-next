---
name: hlou-roundtrip
description: The rules for importing this folder back into Hlou, as rules to obey while editing — the spec (hlou/site/) merged with Hlou's changes and how conflicts are settled, what code is applied, refused, offered and ignored, never touching site/*, the lock or package.json, deleting nothing generated, new images becoming Media assets, and the overlay limits (200 files, 256 KB each). Use before editing, deleting or adding any file, before adding a dependency or changing build config, and before handing the folder back.
---

# Coming back to Hlou

The folder goes back as a zip: the project's **Réglages › Export et import ›
Importer dans ce projet** in the project it came from (or, from the new-project
wizard, into a new project). Hlou compares every file with `hlou/export.json`,
shows a report, and the person importing accepts it. Every rule below is a
refusal you can avoid by obeying it now.

## The spec is merged, and Hlou wins a conflict

`hlou/site/**` is not copied over the project: it is **merged** with what
happened in Hlou since the export, against the version the export came from
(`hlou/export.json` names it).

- A field you changed and Hlou did not: **yours** is applied.
- A field Hlou changed and you did not: **Hlou's** stays.
- A field both changed, differently: a **conflict**. **Hlou's value wins unless
  you choose yours in the report**, item by item (« Garder la version locale »).
- A key the lock (`hlou/site.lock.json`) does not know is a **new** row. Never
  edit the lock: a renamed key comes back as a new row.
- Changed content lands as a draft in Hlou, like any edit.
- A block, prop, locale or media path the project cannot honour is **refused**
  in the report, never dropped silently. `pnpm hlou:compile` catches most of
  them before you zip.

So: run `pnpm hlou:compile` until it is clean, keep your changes to what the
request needs (every field you touch can conflict), and tell the user which
conflicts to expect when you know Hlou changed the same thing.

## Obey these while you work

1. **Never edit `site/*`.** It is compiled from the spec (and rewritten by
   Hlou's build). Write the change in `hlou/site/**` (skill `hlou-site-spec`).
   A change under `site/` is refused.
2. **Never edit `hlou/site.lock.json`, `hlou/export.json`, `hlou/project.json`,
   `package.json`, the lockfile, `next.config.*`, `tsconfig.json`, `.env*` or
   `scripts/**`.** They decide how the site is built and merged. Refused. A new
   dependency is accepted only if the importing person explicitly « adopts the
   build configuration » (`package.json` and the lockfile together); do not add
   one without asking the user first.
3. **Delete nothing generated.** Deleting a file Hlou wrote (a route, a block,
   `site/*`) is refused: the next build would recreate it. To remove a page or
   a section, remove it from the spec. Deleting a file **you added** is fine.
4. **Images**: new files under `public/media/` are **offered** as new Media
   assets, one checkbox each. A changed existing image is refused (Media keeps
   versions; upload the new one in Hlou). Give a new image a new name and use
   its path (`/media/<dir>/<file>`) in the spec.
5. **Only Hlou block types.** A document node whose type is not a Hlou block
   is refused (« bloc inconnu de Hlou »). Use a `custom` block and a
   `codeVariant` (skill `hlou-code-variant`), never a new block type.
6. **Overlay limits.** Every changed or added editable code file becomes an
   overlay row: at most **200** per project (counting the ones it already has)
   and **256 KB** each. Over the limit is refused file by file, never
   truncated. Keep generated or vendored libraries out of the tree.
7. **The agent files are ignored**: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`,
   `.cursor/**`, `.github/copilot-instructions.md`, `.claude/**`. Every export
   regenerates them, so edits there are lost. Put notes for the next developer
   in `custom/README.md`.

## What the report says

| Group         | What lands there                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**      | the merged changes to pages, sections, documents, theme, content and collections, page by page                                   |
| **Conflicts** | a spec field both sides changed (Hlou's kept unless you pick yours), or an editable file Hlou also changed (yours wins, flagged) |
| **Applied**   | changed and added files in editable code paths (`custom/**`, `app/(custom)/**`, block components, other starter files)           |
| **Refused**   | grouped by reason, each item named with why                                                                                      |
| **Offered**   | new images, as Media assets                                                                                                      |
| **Ignored**   | the agent files, `node_modules`, `.next`, `out`, OS debris                                                                       |

## Before handing the folder back

- `pnpm hlou:compile`, `pnpm check-types` and `pnpm build` pass (Hlou
  type-checks a site with hand edits, and its build is this same static
  export).
- `git diff` (or a compare with a fresh export) touches nothing under `site/`,
  `hlou/site.lock.json`, `hlou/export.json`, `package.json`, the lockfile or
  `next.config.*`.
- Zip the folder without `node_modules`, `.next` and `out`.
- Tell the user what they must still do in Hlou: import the zip, settle the
  conflicts, publish, and anything about people, domains or form delivery.
