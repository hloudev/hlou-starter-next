/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { SectionProps } from './schema';

import { blockParts, FloatingLayer, SlotArea, styleVars } from '../shared';
import { cx, freeGridClasses, freeRowUnitValue } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/*
 * A coloured surface paints the section, then re-points the theme tokens for
 * everything inside it: the nested blocks keep reading `--site-ink`,
 * `--site-ink-soft`, `--site-hairline*`, `--site-card` (and, on accent,
 * `--site-accent` / `--site-on-accent`), so a heading, a text, a table or a
 * ghost button recolour without any rule of their own.
 *
 * Two steps, because a custom property cannot read the value it replaces on
 * the same element: the root captures the surface's pairing
 * (`--site-section-on`, and the accent itself) and paints the background with
 * the real tokens; the content box re-points the tokens off the captured ones.
 *
 * - `ink` / `accent`: body ink → the surface's foreground; soft ink (a text
 *   body, a caption, a table head) → that foreground at 86% (the old
 *   `opacity: 0.86`); hairlines → the foreground at 9% / 40% (a ghost
 *   button's border was `currentColor` at 40%); a card (a striped row) → the
 *   foreground at 8%.
 * - `accent` also swaps accent and on-accent: a primary button turns paper
 *   (on-accent fill, accent label), an eyebrow and a link take the foreground.
 */
const ON_SURFACE =
  '[--site-ink:var(--site-section-on)] [--site-ink-soft:color-mix(in_srgb,var(--site-section-on)_86%,transparent)] [--site-hairline:color-mix(in_srgb,var(--site-section-on)_9%,transparent)] [--site-hairline-strong:color-mix(in_srgb,var(--site-section-on)_40%,transparent)] [--site-card:color-mix(in_srgb,var(--site-section-on)_8%,transparent)]';

const BACKGROUND: Record<SectionProps['background'], { root: string; content: string }> = {
  paper: { root: '', content: '' },
  well: { root: 'bg-site-well', content: '' },
  accent: {
    root: 'bg-site-accent text-site-on-accent [--site-section-on:var(--site-on-accent)] [--site-section-accent:var(--site-accent)]',
    content: `${ON_SURFACE} [--site-accent:var(--site-section-on)] [--site-on-accent:var(--site-section-accent)]`,
  },
  ink: {
    root: 'bg-site-ink text-site-on-ink [--site-section-on:var(--site-on-ink)]',
    content: ON_SURFACE,
  },
};

/* Nested in another layout block, a `wide` box gives up its cap (the
   container already has one); `narrow` and `full` keep theirs. */
const WIDTH: Record<SectionProps['width'], string> = {
  narrow: 'max-w-[68ch]',
  wide: 'max-w-site-content in-[.hl-slot]:max-w-none',
  full: 'max-w-none',
};

/*
 * A section planned in Structure and not designed yet draws the
 * planned box — its pattern and its label — wherever it is edited or
 * previewed. The box sits over the empty slot (the drop zone stays under it)
 * and goes as soon as the section holds a block: CSS (`:has`), because a
 * slot is a render function here and in Puck alike, so its emptiness cannot
 * be read from props. A published site leaves the empty section out
 * (`SiteRender`).
 */
const PLANNED_CONTENT =
  'min-h-32 has-[[data-hl-block]]:min-h-0 [&:has([data-hl-block])>.hl-planned]:hidden';
const PLANNED_BOX =
  'hl-planned pointer-events-none absolute inset-0 flex items-center gap-3.5 rounded-site border border-dashed border-site-hairline-strong bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,color-mix(in_srgb,var(--site-ink)_3%,transparent)_10px,color-mix(in_srgb,var(--site-ink)_3%,transparent)_20px)] px-6 text-site-ink-soft';

/** The node fields a block receives in Puck and from `renderDoc` (`DOC_SIDE_MAP_PROP`). */
const SIDE_MAP_PROP = '__hl';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/** A planned section's label (its node's name), or `null` for any other section. */
function plannedLabel(props: Record<string, unknown>): string | null {
  const side = props[SIDE_MAP_PROP];
  if (typeof side !== 'object' || side === null) return null;
  const { section, name } = side as Record<string, unknown>;
  if (typeof section !== 'string') return null;
  return typeof name === 'string' ? name : '';
}

/**
 * An agency's pattern (`t:<uuid>`): its pill would show a
 * uuid, and the label beside it already names the section.
 */
function isTenantGlyph(glyph: string): boolean {
  return glyph.startsWith('t:');
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * A container: one slot, a background, a width. The blocks it holds drop
 * their outer padding and stack with a gap, so a heading, a text and a button
 * read as one composed section. Its own padding is the theme's density
 * (`.hl-blk`) until its `style` sets one.
 */
export function SectionBlock(props: BlockProps<SectionProps>): ReactElement {
  const background = BACKGROUND[props.background] ?? BACKGROUND.paper;
  const { root, context } = blockParts(props, 'section', background.root);
  const planned = context.mode === 'static' ? null : plannedLabel(props);
  /* A free section: the slot is a column grid its blocks are placed on. */
  const free = props.layout === 'free';

  return (
    <section {...root}>
      <div
        className={cx(
          'relative mx-auto w-full',
          WIDTH[props.width] ?? WIDTH.wide,
          background.content,
          planned !== null && PLANNED_CONTENT
        )}
        style={free ? styleVars({ '--hl-free-row': freeRowUnitValue(props.rowUnit) }) : undefined}
      >
        {planned !== null ? (
          <div className={PLANNED_BOX} role="note">
            {props.glyph && !isTenantGlyph(props.glyph) ? (
              <span className="rounded-site-pill border border-site-hairline-strong px-2 py-1 font-mono text-site-xs tracking-[0.08em] uppercase">
                {props.glyph}
              </span>
            ) : null}
            <span className="text-site-sm">{planned}</span>
          </div>
        ) : null}
        {free ? (
          <SlotArea slot={props.content} layout={freeGridClasses(props.freeColumns).join(' ')} />
        ) : (
          <SlotArea slot={props.content} />
        )}
        <FloatingLayer slot={props.floating} />
      </div>
    </section>
  );
}
