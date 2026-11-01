/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { createElement } from 'react';

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { HeadingProps } from './schema';
import { headingDefaults } from './defaults';

import { AccentText } from '../accent';
import { bindAttr, blockParts, literal } from '../shared';
import { cx } from '../tw';

/** `"Vibe, Workspace"` → the words to mark. */
export function splitAccentWords(value: unknown): string[] {
  return typeof value === 'string' ? value.split(/[,\s]+/).filter(Boolean) : [];
}

const HEADING_LEVELS = ['h1', 'h2', 'h3', 'h4'] as const;

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const ALIGN: Record<HeadingProps['align'], string> = {
  start: '',
  center: 'text-center',
  end: 'text-end',
};

/* h1–h3 set in the heading font, largest first; h4 is a small caps label in
   the body font. Negative tracking is Latin-only (`rtl:tracking-normal`). */
const LEVEL: Record<(typeof HEADING_LEVELS)[number], string> = {
  h1: 'font-heading text-site-xl font-normal tracking-[-0.015em] md:text-[calc(var(--site-type-xl)*1.25)]',
  h2: 'font-heading text-site-lg font-normal tracking-[-0.015em]',
  h3: 'font-heading text-site-md font-normal tracking-[-0.015em]',
  h4: 'font-sans text-site-sm font-medium tracking-[0.02em] uppercase',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function HeadingBlock(props: BlockProps<HeadingProps>): ReactElement {
  /* A primitive on its own row breathes less than a composed section. */
  const { root, el } = blockParts(props, 'heading', cx('[--site-pad-y:18px]', ALIGN[props.align]));
  const text = literal(props.text, headingDefaults.text as string);
  /* The element type is a STORED string, and a block's schema never ran on it
     (`puckDataSchema` keeps props as `unknown`): `level: 'script'` would be
     server-rendered as a live <script>. Anything off the list is an h2. */
  const level = HEADING_LEVELS.find((candidate) => candidate === props.level) ?? 'h2';
  /* `createElement` with the level string, not a `<Tag>` made during render. */
  /* A text bound to a scope value carries `data-hl-bind`: the runtime
     rewrites the element's text, accents and all. */
  const heading = createElement(
    level,
    {
      ...el('text', cx('m-0 leading-[1.1] text-balance rtl:tracking-normal', LEVEL[level])),
      ...bindAttr(props, 'text'),
    },
    <AccentText
      text={text}
      words={splitAccentWords(props.accentWords)}
      decoration={props.decoration}
      color={props.decorationColor}
      accent={el('accent', 'text-site-accent')}
    />
  );

  return (
    <div {...root}>
      <div className="mx-auto w-full max-w-site-content in-[.hl-slot]:max-w-none">{heading}</div>
    </div>
  );
}
