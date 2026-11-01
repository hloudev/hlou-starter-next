---
name: hlou-content-contract
description: How content reaches the page in a Hlou site — where copy is written (hlou/site/content/<locale>.json), site/content.ts (records, Localized<T>, pick, getBySlug), slot references ($slot), collection queries ($collection), the data-hl-block / data-hl-field attributes and the Island boundary. Use when reading copy, records or images in code, when a request asks to change text, prices or translations, or when wiring hardcoded copy to Hlou content.
---

# The content contract

Copy, records and media are **data, not code**. They are written in the site
spec (`hlou/site/`, skill `hlou-site-spec`): a slot's text per locale in
`hlou/site/content/<locale>.json`, records in
`hlou/site/collections/<key>.json`. `pnpm hlou:compile` turns them into the
files under `site/` that the site reads (Hlou's build writes the same files
from the project's data); nothing is fetched. Code reads content, it never
holds it.

## `site/content.ts` (generated)

```ts
import {
  records,
  pick,
  getBySlug,
  defaultLocale,
  type Locale,
} from "@/site/content";

const jasmin = getBySlug("rooms", "jasmin", "fr"); // a published record, or undefined
const title = pick(jasmin?.title ?? {}, "ar"); // ar, else the fallback locale, else any
const cheapest = [...records.rooms].sort((a, b) => a.price - b.price)[0];
```

- `locales`, `Locale`, `defaultLocale` (the source locale, `fr` here).
- `Localized<T>` = `Partial<Record<Locale, T>>`: a localised field holds one
  value per locale. Always read it with `pick(value, locale)`; never index
  `value.fr` directly.
- One interface per collection (`Room`, `Journal`…), and `records`: the
  **published** records of each collection, `as const`.
- `MediaRef` is an asset id; the file is `site/snapshot.json` › `media[id].url`
  (`/media/<assetId>/<file>`), with `alt` per locale.
- It is server-side data: import it in server components and pass plain values
  to client components. Importing it into a `"use client"` file ships every
  record to the browser.

## Bound props: `$slot`, `$record`, `$collection`

In `site/snapshot.json` a block's props hold references, not text:

- `{ "$slot": "slot-home-hero-title" }`: a content slot. Its value per locale
  is `content[locale][slotId]` (`{ kind: "text", text }`, `{ kind: "richtext",
doc }`, `{ kind: "media", assetId }`). `pages[].slots` and `siteSlots` list
  the slots with their key (`hero.title`, `site.logo`). Site-wide slots are
  also in `site/messages/<locale>.json`.
- `{ "$record": "title" }`: a field of the current record on a collection
  template page (`/rooms/[slug]`).
- `{ "$collection": "rooms", "query": { "filter": {…}, "sort": { "field":
"price", "dir": "asc" }, "limit": 3 } }`: a list prop fed by published records
  (`collectionQuery`).

In the spec the same references are written with keys: `{ "$slot": "hero.title" }`
(a slot of the page), `{ "$slot": "site/nav.logo" }` (a site slot),
`{ "$collection": "rooms" }`; the compile turns them into the ids above.

`SiteRender` resolves every reference for the page's locale before a component
runs, so a component reads plain values through `literal(prop, fallback)` and
`literalMedia(prop)`. **To change the text, change it in the spec**:
`hlou/site/content/<locale>.json` for a slot (`"home/hero.headline"`), the
record's `data` in `hlou/site/collections/<key>.json`, then
`pnpm hlou:compile` — never the snapshot, never the component.

## `data-hl-block` and `data-hl-field`

- `data-hl-block="<node id>"` and `data-hl-block-type` sit on every block root
  (from `blockParts`'s `root`). Hlou's canvas, its agent and its code anchors
  find blocks by them. Keep them.
- `data-hl-field="title"` (or `buttons[1]`) marks the element that draws one
  prop, but only in Hlou's canvas (`context.mode !== "static"`): the published
  site ships none. They make click-to-edit work, and they come from `el()` and
  `item()`. A variant that draws the title without `el('title', …)` breaks
  click-to-edit on that block.

## `Island`

A published Hlou page runs **no client script** except two islands, the form
and the theme toggle (`renderer/render/island.tsx`). `Island` renders them as
plain client components in this Next build. Do not add islands (that is a
renderer edit). Your interactive code is an ordinary `"use client"` component
in `custom/`, used from a page in `app/(custom)/` or from a variant
(`custom/README.md`).

## Wiring hardcoded copy to Hlou

When code contains text that should be editable in Hlou, the fix is a slot or a
record field in the spec (declared in the page or collection, with a value per
locale) plus a read here (`pick(records…)` or a bound prop), not a translation
file. If no Hlou field can hold it (a loading message in your own
widget), keep it in the user zone, one entry per locale (`custom/copy.ts`).
