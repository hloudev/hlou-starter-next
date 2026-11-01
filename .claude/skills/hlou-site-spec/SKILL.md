---
name: hlou-site-spec
description: How to write a Hlou site's pages, sections, blocks, theme, content, locales, media and collections as the keyed JSON spec in hlou/site/ — the file tree, the key grammars, $slot bindings, content per locale, pnpm hlou:compile and its error codes, with worked examples. Use for any request that adds or changes a page, a section, a block on a page, a translation, the colours or fonts, an image, or a collection's fields or records.
---

# The site spec: `hlou/site/`

A Hlou site's **definition** is a folder of JSON files under `hlou/site/`, named
by **keys** (a page by its slug, a slot by its key, a medium by its path), never
by uuids. You write it; `pnpm hlou:compile` checks it and compiles it into
`site/`, which the site renders. Hlou merges it back on import.

- **Write in `hlou/site/**`.** Never in `site/**`: it is compiled output, and
  the next compile (or Hlou build) overwrites it.
- **Never edit `hlou/site.lock.json`** (nor `hlou/export.json`,
  `hlou/project.json`). The lock maps each key to the uuid it had in Hlou: that
  is how the import tells a renamed key from a new row. A key that is not in
  the lock is simply new.
- **After every change, run `pnpm hlou:compile`** and fix every error before
  the next change. `pnpm dev` compiles on every save too and prints the same
  errors; `site/` stays as it was while the spec is invalid.

Each file may carry `"$schema"` pointing at its JSON Schema in
`renderer/spec/json-schema/` (`site`, `page`, `content`, `collection`,
`lock`); editors then complete and check keys as you type. The Zod source of
truth is `renderer/spec/schema.ts`, the cross-file rules are
`renderer/spec/validate.ts`.

## The tree

```
hlou/
  site/
    site.json                  format 1, project settings, locales, theme, components (header, footer), site slots
    pages/<slug>.json          one page: path, title, status, sections and their slots, the canvas document
    content/<locale>.json      every slot's value in that locale, keyed <pageSlug>/<slotKey> or site/<slotKey>
    collections/<key>.json     one collection: fields, forms, records
  site.lock.json               generated — never edit
public/media/<dir>/<file>      the bytes of every medium, named /media/<dir>/<file> in the spec
```

Every object is strict: a key the format does not know is an error
(`unknown_key`), never silently dropped. Optional fields have documented
defaults (a page's `status` is `draft`, a slot is `localizable`).

## Keys

| What                         | Grammar                                       | Examples                                       |
| ---------------------------- | --------------------------------------------- | ---------------------------------------------- |
| page slug, component, record | `[a-z0-9]` words joined by single `-`         | `home`, `room-detail`, `chambre-marine`        |
| section key                  | words joined by `-` or `_`                    | `hero`, `room-grid`, `room_grid`               |
| slot key                     | lowercase start, then `.` `_` `-` + camelCase | `hero.headline`, `seo.title`, `site.logoImage` |
| collection, form, field      | `^[a-z][a-z0-9_]*$`                           | `rooms`, `contact_requests`, `opened_on`       |
| locale                       | a language tag                                | `fr`, `en`, `ar`, `en-GB`                      |
| medium                       | `/media/<dir>/<file>` (one folder level)      | `/media/home/terrace.png`                      |

- A key is a name, **never a uuid** (rejected).
- `site` is reserved: it names the site scope in content keys, not a page.
- A page's slug is its file name: `pages/tarifs.json` is the page `tarifs`.
- Slot keys are unique **per page** (page-level and section slots together).
- A section's `pattern` is a built-in wireframe key (`hero-left`) or `t:<uuid>`,
  an agency library entry: the one opaque id a spec may carry. Copy those, never
  invent one.

## A page: `pages/<slug>.json`

```json
{
  "$schema": "../../../renderer/spec/json-schema/page.schema.json",
  "path": "/tarifs",
  "title": "Tarifs",
  "parent": "home",
  "status": "published",
  "position": 3,
  "slots": [{ "key": "seo.title", "kind": "text" }],
  "sections": [
    {
      "key": "offers",
      "label": "Offres",
      "slots": [{ "key": "offers.title", "kind": "heading" }]
    }
  ],
  "document": { "root": "root", "rootProps": {}, "nodes": { "…": "…" } }
}
```

- `path`: `/`, `/tarifs`, `/rooms/[slug]` (a `collection_template` page, with
  `kind` and `collection`). Unique across pages.
- `status`: `draft` (the default) pages are **not routed**: `pnpm dev` shows
  only `ready` and `published` pages. Publishing for real stays a Hlou step.
- `parent`: another page's slug, or `null`. `position`: the order among
  siblings.
- `slots` (page-level, typically `seo.*`) and each section's `slots` declare
  the **editable values** of the page. Slot `kind`: `text`, `heading`,
  `richtext`, `media`, `navigation`, `dynamic` (a collection query).
  `localizable: false` = one value for every locale.
- `sections`: Structure's plan of the page, in order. `document`: what the
  canvas draws. A page with no `document` is only planned.

## The document

A tree of nodes in `nodes`, by node id. Ids are the spec's own names: keep
existing ones, give new nodes readable unique ids (`offers-pricing`).

```json
"root":   { "id": "root", "type": "root", "parent": null, "slot": "", "order": "a0", "props": {} },
"header": { "id": "header", "type": "instance", "parent": "root", "slot": "content", "order": "a0", "props": {}, "instanceOf": "header" },
"offers-pricing": {
  "id": "offers-pricing", "type": "featureGrid", "parent": "root", "slot": "content", "order": "a1",
  "section": "offers",
  "props": { "title": { "$slot": "offers.title" }, "cards": [], "columns": 3, "bordered": true }
}
```

- `type`: a block key from `renderer/blocks/index.ts` (`BLOCK_KEYS`: `hero`,
  `pageHeader`, `featureGrid`, `cards`, `stats`, `ctaBand`, `form`, `heading`,
  `text`, `image`, `section`, `stack`…), `root`, or `instance` (a component of
  `site.json`, named by `instanceOf`: `header`, `footer`). Anything else is
  `block_unknown`. Never invent a block: a section no block draws is a
  `custom` block plus a `codeVariant` (skill `hlou-code-variant`).
- `parent` + `slot` + `order`: a child of the root sits in slot `content`;
  `order` strings sort the siblings (`a0`, `a1`, `a2`…; `a1V` slots between
  `a1` and `a2`). A child of a block sits in one of that block's slot props
  (`floating`, a `section`'s or `stack`'s content).
- `props`: the block's own props, checked against
  `renderer/blocks/<key>/schema.ts`. Give the props you set: the compiler
  writes them over the block's `defaults.ts`, as a block inserted in Hlou gets
  them, so a prop you leave out takes its default (which may be placeholder
  copy: set or bind every text the page shows). An object prop (`mapping`)
  replaces its default whole and carries every key its schema requires. An
  unknown prop or a wrong value is `block_props_invalid`, and the message
  lists the block's props.
- `section`: the page section this node draws (its key). Optional.
- `role`, `variant`, `design` (`{ "scheme": "sand" }`), `hidden`: as Hlou
  stores them; copy them from a similar node.
- Media in props: `{ "url": "/media/<dir>/<file>", "alt": "…" }`, the file
  present under `public/media/`.
- Fonts in props: `{ "family": "Maison Neue", "source": "custom" }` needs a
  custom face of that family in `site.json`'s theme; never an `assetId`.

### Bound props: what gets translated

A prop holds either a **literal** or a **reference**:

- `{ "$slot": "offers.title" }`: a slot **this page** declares, or
  `{ "$slot": "site/nav.logo" }` for a site slot. Its value comes from
  `content/<locale>.json`, **per locale**. Components (header, footer) bind
  only site slots.
- `{ "$collection": "rooms" }`, `{ "$form": "contact" }`, `{ "$record": "title" }`
  (a field of the current record, on a collection template page).
- A literal string is the same in every locale. **Visitor-facing text that must
  be translated goes through a slot**, including inside lists
  (`"cards": [{ "title": { "$slot": "offers.basic.title" }, … }]`).

## Content: `content/<locale>.json`

```json
{
  "$schema": "../../../renderer/spec/json-schema/content.schema.json",
  "values": {
    "tarifs/offers.title": { "kind": "heading", "text": "Nos offres" },
    "site/nav.cta": { "kind": "text", "text": "Réserver une visite" }
  }
}
```

- Key: `<pageSlug>/<slotKey>`, or `site/<slotKey>`. One file per locale.
- The value's `kind` is its slot's kind (`content_kind_mismatch` otherwise):
  `{ "kind": "text"|"heading", "text" }`,
  `{ "kind": "richtext", "docVersion": 1, "doc": { "type": "doc", "content": [ … ] } }`
  (TipTap JSON), `{ "kind": "media", "src": "/media/…", "alt": "…" }`,
  `{ "kind": "navigation", "items": [{ "label", "page" | "href", "children"? }] }`
  (`page` is a page slug), `{ "kind": "dynamic", "collection", "query"? }`.
- Write the source locale first (`project.sourceLocale`), then every other
  enabled locale. A disabled locale may keep its content.

## `site.json`

`format: 1`; `project` (`sourceLocale`, `indexable`, `site` settings,
`attribution`); `locales` in order (`{ "code": "it", "enabled": false }` is kept
but not published; the source locale cannot be disabled); `theme`; `components`
(header and footer documents, which bind `site/…` slots); `slots` (site-wide
slots: `nav.links`, `nav.logo`, `footer.legal`, `site.logoImage`…).

The theme: `colors` by role key (`accent`, `paper`, `ink`… with `value` and
optional `dark`), `fonts` by role key (`heading`, `body`…: `source: "google"`
with `family`, or `source: "custom"` with `family` and `src` = a font file under
`public/media/`; `localeOverrides` per locale), `density`, `radius`,
`typeScale`, `schemes` (named colour overrides a node picks with
`design.scheme`).

## Collections: `collections/<key>.json`

`name`, `localized`, `fields` (`key`, `label`, `type`: `text`, `richtext`,
`slug`, `number`, `boolean`, `date`, `media`, `select`, `email`, `relation`,
`money`, `daterange`, `phone`, `country`; `localized` for one value per
locale; `options` such as `choices`; `relation: { collection, cardinality }`),
`forms` (`key`, `label`, `fieldMap`), `records` (`key`, `status`, `slug`,
`data`). In `data`, a localised field is `{ "fr": …, "en": … }`, a relation is
the target record's key (or a list), a medium is its path. A
`websiteWritable` collection has no records in the spec (they are visitor
submissions). Only `published` records reach the site.

## How to…

| Do this          | Write                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| add a page       | `pages/<slug>.json` (path, title, `status: "published"` to see it, position, sections + slots, document with the header and footer instances), its values in **every** `content/<locale>.json`, and a link in `site/nav.links`                                                                                                                                                                                                                                                                                                                             |
| add a section    | an entry in the page's `sections` (key, label, slots), the node(s) that draw it in `document` with `"section": "<key>"`, and its slot values per locale                                                                                                                                                                                                                                                                                                                                                                                                    |
| add a block      | a node in `document` (unique id, parent, slot, order between its neighbours), props from the block's `schema.ts`; translatable text as slots                                                                                                                                                                                                                                                                                                                                                                                                               |
| add a locale     | `{ "code": "de" }` in `site.json` `locales`, then `content/de.json` with a value for every localisable slot                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| add a medium     | the file at `public/media/<dir>/<file>` (a new name: never overwrite an existing file, Media keeps versions in Hlou), then `/media/<dir>/<file>` wherever it is used                                                                                                                                                                                                                                                                                                                                                                                       |
| add a collection | `collections/<key>.json` (fields, records), then `{ "$collection": "<key>" }` in a list block or a `dynamic` slot                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| rename a key     | avoid it. Hlou recognises two renames only: a page whose slug changed while its `path` stayed, and a section a `document` node still draws. Any other renamed key — a slot, a component, a collection, a field, a form, a record — is a deletion plus an addition: Hlou deletes the old row with its content (approval state, versions) and creates the new one, its values as drafts; the import report lists both. When you must, rename it everywhere it is used (`$slot`, the `<pageSlug>/<slotKey>` content keys in every locale), in the same change |

## Errors `pnpm hlou:compile` prints, and their fix

Each line is `<file> at <path>  [<code>] <message>`.

| Code                    | Fix                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `json_invalid`          | the file is not JSON: a trailing comma, a comment, an unescaped quote                          |
| `file_unknown`          | a file under `hlou/site/` outside the tree above: move or delete it                            |
| `file_missing`          | `hlou/site/site.json` is missing                                                               |
| `file_name_invalid`     | rename the file: a slug, locale or key that breaks its grammar                                 |
| `schema_invalid`        | a wrong type or shape at that path: read the JSON Schema                                       |
| `unknown_key`           | a key the format does not know: remove it (or fix its spelling); never an `assetId`            |
| `key_duplicate`         | two rows with one key (or two pages with one path) in the same scope                           |
| `reference_unknown`     | a page, section, component, collection, form or record named and not defined                   |
| `parent_cycle`          | pages whose `parent`s loop                                                                     |
| `block_unknown`         | a node `type` that is not a block key: pick one from `BLOCK_KEYS`                              |
| `block_props_invalid`   | a prop the block lacks or a bad value: read `renderer/blocks/<key>/schema.ts`                  |
| `document_invalid`      | not one tree: a node stored under another id, a missing `parent`, a second root, an orphan     |
| `slot_undeclared`       | a `$slot` the page (or `site.json`, for `site/…`) does not declare: declare it, or fix the key |
| `content_slot_unknown`  | a content key with no such slot: fix the key or declare the slot                               |
| `content_kind_mismatch` | the value's `kind` differs from its slot's                                                     |
| `locale_unknown`        | a content file for a locale `site.json` does not list                                          |
| `locale_disabled`       | the source locale is listed as disabled                                                        |
| `font_unknown`          | a block's custom font with no custom face of that family in the theme                          |
| `media_missing`         | no file under `public/media/` for that path: add it, or fix the path                           |
| `records_not_allowed`   | records in a website-writable collection: remove them                                          |
| `field_unknown`         | a record value, `$record` or form mapping naming a field the collection lacks                  |

Fix the errors in the order printed; one cause often prints several lines.
Never edit `site/` or the scripts to make an error go away.

## Worked examples

On the `real-estate` site (FR source, EN and AR enabled). After each,
`pnpm hlou:compile` prints no error and `pnpm dev` shows the change.

### 1. Change a title, and translate it

The hero's title is bound: `pages/home.json` › `hero-home` › `title` is
`{ "$slot": "hero.headline" }`. Change the text in the content files, not in
the page:

```json
// content/fr.json
"home/hero.headline": { "kind": "heading", "text": "Vivre là où la mer rencontre la chaux" },
// content/en.json
"home/hero.headline": { "kind": "heading", "text": "Live where the sea meets the lime" },
```

A literal prop (`"eyebrow": "Sidi Bou Saïd · portfolio 2026"`) has one value for
every locale. To translate it, declare a slot in the section
(`{ "key": "hero.eyebrow", "kind": "text" }`), bind the prop
(`"eyebrow": { "$slot": "hero.eyebrow" }`) and write `home/hero.eyebrow` in each
content file.

### 2. Add a section to an existing page

A testimonial between the call to action and the footer of `rooms`:

1. `pages/rooms.json` › `sections`: add
   `{ "key": "testimonial", "label": "Témoignage", "slots": [{ "key": "testimonial.quote", "kind": "text" }, { "key": "testimonial.by", "kind": "text" }] }`.
2. `document.nodes`: add a node between the `ctaBand` (`order` `"a4"`) and the
   footer instance (`"a5"`), its text bound:

   ```json
   "quote-rooms": {
     "id": "quote-rooms", "type": "quote", "parent": "root", "slot": "content", "order": "a4V",
     "section": "testimonial",
     "props": { "quote": { "$slot": "testimonial.quote" }, "by": { "$slot": "testimonial.by" }, "align": "center" }
   }
   ```

3. `rooms/testimonial.quote` and `rooms/testimonial.by` in `content/fr.json`,
   `content/en.json` and `content/ar.json`.

### 3. Add a page with translated cards

A page « Tarifs » with three offers:

1. `pages/tarifs.json`: `path` `/tarifs`, `title` `Tarifs`, `parent` `home`,
   `status` `published`, a free `position`; page slots `seo.title`,
   `seo.description`; a section `offers` declaring `offers.title` (heading) and,
   per offer, `offers.o1.title` and `offers.o1.price` (text), then `o2`, `o3`.
2. Its document: `root`; the `header` instance (`a0`); a `featureGrid`
   (`a1`, `"section": "offers"`) whose `title` is `{ "$slot": "offers.title" }`
   and whose three `cards` bind `title` and `description` to the offers' slots,
   with an `icon` name each (`ruler`, `key`, `hammer`); the `footer` instance
   (`a2`).
3. Every slot's value in `content/fr.json` **and** `content/en.json` (and
   `ar.json` when the site has it): `"tarifs/offers.o1.title": { "kind": "text", "text": "Essentiel" }`…
4. A link: in `site/nav.links` (a `navigation` value), add
   `{ "label": "Tarifs", "page": "tarifs" }`. A non-localisable slot
   (`localizable: false`) has its one value in the source locale's file.
5. `pnpm hlou:compile`, then open `/fr/tarifs/` and `/en/tarifs/`.

## Avec le serveur MCP de Hlou

Connected to Hlou's MCP server, the spec needs no zip:

1. `site_spec_get` → write its files under `hlou/` (the lock as it is). Its
   `media` list is what Hlou already holds: those paths validate without a file
   in `public/media/`, but `pnpm hlou:compile` needs them on disk, so rely on
   `site_spec_validate` when they are not.
2. Edit `hlou/site/**`; `site_spec_validate` with the files (and the new media
   paths) until `ok` is true. Its errors are the codes above.
3. `site_spec_plan` → `changes`, `conflicts` (each with `draft` = Hlou's value
   and `local` = yours), `refusals` and `uploads`. PUT each new medium's bytes
   to its `uploadUrl`. A refusal blocks the apply: fix it and plan again.
4. Show the person the changes and the conflicts, and ask. Never apply on your
   own initiative.
5. `site_spec_apply { planId, keepLocal }` once they approve: `keepLocal` lists
   the conflict ids they want resolved to the spec. `APP_ERR_IMPORT_DRAFT_CHANGED`
   means someone edited the project since the plan: plan again and show it again.

## What stays in Hlou

People and access, domains, publishing and hosting, form delivery (where
submissions go), the agency library, and media already in Hlou's library (an
existing file is never replaced from here). Say so when a request needs one of
them.
