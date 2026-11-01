/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { GridProps } from './schema';
import { GRID_COLUMN_KEYS } from './schema';

import { blockParts, SlotArea, styleVars } from '../shared';
import { cx, GRID_COLUMN_CLASSES } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const GAP: Record<GridProps['gap'], string> = {
  tight: 'gap-2.5',
  base: 'gap-5',
  roomy: 'gap-10',
};

const ROW_GAP: Record<NonNullable<GridProps['rowGap']>, string> = {
  tight: 'gap-y-2.5',
  base: 'gap-y-5',
  roomy: 'gap-y-10',
};

const ALIGN: Record<GridProps['align'], string> = {
  start: 'items-start',
  center: 'items-center',
  stretch: 'items-stretch',
};

const JUSTIFY: Record<NonNullable<GridProps['justify']>, string> = {
  start: 'justify-items-start',
  center: 'justify-items-center',
  end: 'justify-items-end',
};

/** Unequal templates (M29), from the tablet up; literal so Tailwind finds them. */
const TEMPLATE: Record<NonNullable<GridProps['template']>, string> = {
  equal: '',
  '2-1': 'md:grid-cols-[2fr_1fr]',
  '1-2': 'md:grid-cols-[1fr_2fr]',
  '3-1': 'md:grid-cols-[3fr_1fr]',
  '1-3': 'md:grid-cols-[1fr_3fr]',
  'auto-1': 'md:grid-cols-[auto_1fr]',
  '1-auto': 'md:grid-cols-[1fr_auto]',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * Two to four columns, each a slot — one column on a phone, the count from
 * the tablet up. A column beyond the count keeps its blocks but is not drawn,
 * so narrowing a grid loses nothing.
 */
export function GridBlock(props: BlockProps<GridProps>): ReactElement {
  const { root } = blockParts(props, 'grid');
  const template = props.template && props.template !== 'equal' ? TEMPLATE[props.template] : '';
  const count = template ? 2 : Math.max(1, Math.min(4, props.columns));
  const columns = GRID_COLUMN_KEYS.slice(0, count);
  /* The phone's count is its own; the tablet's follows the desktop unless set. */
  const base =
    props.columnsBase === '2' ? GRID_COLUMN_CLASSES.base['2'] : GRID_COLUMN_CLASSES.base['1'];
  const md =
    template ||
    (props.columnsMd
      ? GRID_COLUMN_CLASSES.md[
          String(Math.max(1, Math.min(4, props.columnsMd))) as '1' | '2' | '3' | '4'
        ]
      : 'md:grid-cols-[repeat(var(--site-grid-cols),minmax(0,1fr))]');
  const lg =
    props.columnsMd && !template
      ? 'lg:grid-cols-[repeat(var(--site-grid-cols),minmax(0,1fr))]'
      : '';

  return (
    <section {...root}>
      <div
        className={cx(
          'mx-auto grid w-full max-w-site-content in-[.hl-slot]:max-w-none',
          base,
          md,
          lg,
          GAP[props.gap] ?? GAP.base,
          props.rowGap && ROW_GAP[props.rowGap],
          ALIGN[props.align] ?? ALIGN.start,
          props.justify && JUSTIFY[props.justify]
        )}
        style={styleVars({ '--site-grid-cols': columns.length })}
      >
        {columns.map((key) => (
          <SlotArea key={key} slot={props[key]} className="min-w-0" />
        ))}
      </div>
    </section>
  );
}
