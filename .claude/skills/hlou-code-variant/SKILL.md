---
name: hlou-code-variant
description: The one sanctioned way to change a Hlou block's markup — a codeVariant === 'custom:<name>' branch in renderer/blocks/<key>/Component.tsx that only the instances carrying that variant draw (Hlou decision 106), with a worked example. Use when a request changes how a section or block looks beyond what Hlou's design tokens can do, adds a section no block draws, or wires custom code into a Hlou page.
---

# Code variants

A block type's `Component.tsx` draws **every instance of that type on every
page**. Restyling it wholesale changes the whole site and freezes the file
against Hlou's fixes. Instead, add a **variant**: a branch that only the
instances carrying `codeVariant: "custom:<name>"` draw. Every other instance
keeps Hlou's look.

## The rules

1. **Keep Hlou's render.** Leave the existing function body as it is; add your
   branch right after the `blockParts(…)` line and return early from it.
2. **Name it** `custom:<name>`, short kebab-case saying what it is
   (`custom:offre`, `custom:pricing-cards`); `^custom:[a-z0-9-]{1,40}$`.
3. **Draw with the props the schema already has.** Hlou validates against its
   own schema, so editing `schema.ts` changes nothing and new props do not
   exist. The `custom` block's `data` holds anything else, as plain JSON
   (one value for every locale).
4. **No hardcoded copy.** Text and images come from props (`literal`,
   `literalMedia`), so they stay editable in the spec's content files and in
   Hlou Content.
5. **Keep the helpers**: spread `root` on your root element, use `el(…)` on
   named elements and `item(…)` on repeated ones; draw with `MediaFigure`,
   `SiteButton` and `Icon`. That keeps click-to-edit and the designer's styles.
6. **Style with the site tokens and logical utilities** (skill `hlou-blocks`).
7. **Set the variant on the instance in the spec.** In the page's document
   (`hlou/site/pages/<slug>.json`), add `"codeVariant": "custom:offre"` to that
   node's `props`, then `pnpm hlou:compile` (skill `hlou-site-spec`). Until then
   the branch draws nothing. The import carries the variant back to Hlou.

## Imports, and Hlou's live canvas

Hlou's Design canvas runs an edited `Component.tsx` live, and it can only
resolve `react`, `react/jsx-runtime`, `zod` and relative files inside
`renderer/` (`../shared`, `../tw`, `../accent`, `../icon-paths`).

- A variant that stays within those imports shows on the canvas at once and on
  the published site from the next build.
- A variant that imports from `@/custom/…` (an API widget) **builds and
  publishes**, but the canvas shows that block as a code error. That is the
  price of wiring business logic into a Hlou page; say so to the user. A page
  of its own in `app/(custom)/` avoids it (`custom/README.md`, recipe 2).

No `fetch`, timers, `window` or inline `<script>` at render time in the block
itself; components are server-rendered, and Hlou's canvas draws them in the
browser, where React never runs a `<script>`. Interactive parts are
`"use client"` components in `custom/`.

**The current page.** A nav variant marks its link to the page being drawn
with `ariaCurrent` from `../../resolve/href`: `"page"` on the link to this
page, `"true"` on the link to the section it is in (`/archive` on
`/archive/workshop-1`). It reads `context.currentPath`, so it is right on
Hlou's canvas, in Preview and in a build alike, with no script:

```tsx
<a href={link.href} aria-current={ariaCurrent(link.href, context)}
   className="aria-[current=page]:text-site-accent">
```

Style it with `aria-[current=page]:…`, or `aria-[current]:…` for the section
too.

## A section no block draws

Do not bend a library block beyond recognition. In the page's document, add a
**`custom` block** node where the section belongs, its text bound to slots of
the page (eyebrow, title, text, items, media, buttons, `data`) with their
values in the content files; Hlou draws it plainly until a variant exists. Then
draw it here with a variant of `renderer/blocks/custom/Component.tsx`.

## Worked example: an offer banner above the rooms listing

The request: « Ajoute une bannière « Offre d'été » au-dessus de la liste des
chambres. »

- **In the spec**: in `hlou/site/pages/rooms.json`, a section `summer-offer`
  declaring a slot `summer-offer.title`, and a `custom` node above the listings
  with `"section": "summer-offer"`, `"title": { "$slot": "summer-offer.title" }`,
  an empty `"text"` (the default is placeholder copy),
  one button (« Réserver » → `/contact`) and `"codeVariant": "custom:offre"`;
  the title (« Offre d'été : −15 % en juillet ») in `content/fr.json` and the
  other locales' files. `pnpm hlou:compile`.
- **Here**, in `renderer/blocks/custom/Component.tsx`, right after
  `const { root, context, el, item } = blockParts(props, 'custom');`:

```tsx
if (props.codeVariant === "custom:offre") {
  const title = literal(props.title, "");
  const button = props.buttons[0];
  return (
    <section {...root}>
      <div className="max-w-site-content rounded-site bg-site-accent text-site-on-accent mx-auto flex w-full flex-wrap items-center justify-center gap-3 px-4 py-2">
        {title ? (
          <p {...el("title", "m-0 text-site-sm font-medium")}>{title}</p>
        ) : null}
        {button ? (
          <a
            {...item(
              "buttons",
              0,
              button,
              "text-site-sm underline underline-offset-4",
            )}
            href={button.href}
          >
            {literal(button.label, "")}
          </a>
        ) : null}
      </div>
    </section>
  );
}
```

It imports nothing outside `renderer/`, so `pnpm dev` draws it at once, and
Hlou's canvas as soon as the import is accepted. The listings block
is untouched. Had the request been to change the listings'
own markup, the branch would go in `renderer/blocks/listings/Component.tsx`
instead, set on that one instance.
