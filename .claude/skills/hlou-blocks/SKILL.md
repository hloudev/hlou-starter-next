---
name: hlou-blocks
description: How a Hlou block is built and styled — the block definition (key, schema, defaults, Component), where its Tailwind lives, the site design tokens (bg-site-paper, text-site-xl, font-heading, rounded-site) and the md/lg/xl breakpoints. Use when reading or styling a block component, writing markup that must match the site's theme, or choosing Tailwind classes anywhere in this tree.
---

# Blocks and the site's design tokens

## A block

Each block is a folder `renderer/blocks/<key>/`:

| File            | Holds                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `index.ts`      | The `BlockDefinition`: `{ key, label, category, schema, defaults, Component, bindable, … }`              |
| `schema.ts`     | The props as a Zod object. Hlou validates against **its own** copy, so editing this file changes nothing |
| `defaults.ts`   | Props of a fresh instance                                                                                |
| `Component.tsx` | The React server component that draws it: plain Tailwind utilities                                       |

`renderer/blocks/index.ts` is the registry (`blockRegistry`, `BLOCK_KEYS`). A
page's composition in `site/snapshot.json` is a tree of nodes whose `type` is a
block key (`hero`, `featureGrid`, `listings`, `ctaBand`, `custom`…) or
`instance` (a header/footer component). Unknown types render nothing, and the
import refuses them.

Every component starts with `blockParts(props, '<key>')` from `../shared`,
which returns:

- `root`: the attributes to spread on the root element (`data-hl-block`, the
  type, `lang`, `dir`, classes, the designer's box style);
- `el('<element>', classes)`: attributes for a named element (`title`,
  `description`, `buttons`, `image`…), merging the designer's per-element
  style over your defaults;
- `item(name, index, entry, classes)`: the same for one repeated item;
- `context`: `{ locale, dir, mode }`. `mode` is `static` when published,
  `canvas` in Hlou's editor.

Read bound props with `literal(value, fallback)` and `literalMedia(value)`;
draw images with `MediaFigure`, buttons with `SiteButton`, icons with `Icon`.

## Tokens

Defined in `renderer/styles/tailwind.css` from the theme's CSS variables, so a
theme change in Hlou restyles everything that uses them:

- **Colour**: `bg-site-paper`, `bg-site-card`, `bg-site-well`, `text-site-ink`,
  `text-site-ink-soft`, `bg-site-accent`, `bg-site-accent-soft`,
  `text-site-on-accent`, `text-site-on-ink`, `border-site-hairline`,
  `border-site-hairline-strong`. Every one is a light/dark pair.
- **Type**: `text-site-xs`, `text-site-sm`, `text-site-md`, `text-site-lg`,
  `text-site-xl`; `font-heading`, `font-sans`, `font-mono`.
- **Shape**: `rounded-site`, `rounded-site-pill`; width `max-w-site-content`.
- **Raw variables** in arbitrary values: `bg-[color-mix(in_srgb,var(--site-accent)_20%,transparent)]`.

A raw colour or size only when the design has that exact value.

## Breakpoints

Mobile first. `md` 768px, `lg` 1180px, `xl` 1440px: Hlou's canvas viewports
(tablet, desktop, wide).

## Direction

Arabic pages render `dir="rtl"`. Use logical utilities only: `ms-`/`me-`,
`ps-`/`pe-`, `start-`/`end-`, `text-start`/`text-end`, `border-s`/`border-e`,
`rounded-s`/`rounded-e`; `rtl:` for the rare exception. Never `ml-`, `mr-`,
`pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`.

## Cascade

`renderer/styles/site.css` holds the block defaults in the `hl-site` layer,
below Tailwind's `utilities`: a utility you add always wins. Tailwind scans the
whole project, `custom/` included.
