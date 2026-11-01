/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { TableProps } from './schema';

import { blockParts, fieldAttr, literal } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/** Every cell, head and body: a hairline under it, content from the top. */
const CELL = 'border-b text-start align-top';
const CELL_PADDING = { regular: 'px-3 py-2.5', compact: 'px-2 py-1.5' };

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function TableBlock(props: BlockProps<TableProps>): ReactElement {
  /* A primitive on its own row breathes less than a composed section. */
  const { root, context, el, item } = blockParts(props, 'table', '[--site-pad-y:18px]');
  const caption = literal(props.caption, '');
  const padding = props.compact ? CELL_PADDING.compact : CELL_PADDING.regular;
  /* One style per repeated prop: `head` styles every head cell, `rows`
     every body row, `cells` every body cell; each item's own style wins. */
  const head = cx(
    CELL,
    padding,
    'border-site-hairline-strong text-site-xs tracking-[0.08em] text-site-ink-soft uppercase rtl:tracking-normal'
  );
  const row = props.striped ? 'even:bg-site-card' : '';
  const cell = cx(CELL, padding, 'border-site-hairline');

  return (
    <div {...root}>
      <div className="mx-auto w-full max-w-site-content overflow-x-auto in-[.hl-slot]:max-w-none">
        <table className="w-full border-collapse text-site-sm leading-[1.4]">
          {caption ? (
            <caption
              {...el('caption', 'caption-bottom pt-2 text-start text-site-xs text-site-ink-soft')}
            >
              {caption}
            </caption>
          ) : null}
          {props.head.length > 0 ? (
            <thead>
              <tr {...fieldAttr(context, 'head')}>
                {props.head.map((entry, index) => (
                  <th key={index} scope="col" {...item('head', index, entry, head, 'head')}>
                    {literal(entry.text, '')}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody {...fieldAttr(context, 'rows')}>
            {props.rows.map((entry, rowIndex) => (
              <tr key={rowIndex} {...item('rows', rowIndex, entry, row, 'rows')}>
                {entry.cells.map((content, cellIndex) => (
                  <td
                    key={cellIndex}
                    {...item(`rows[${rowIndex}].cells`, cellIndex, content, cell, 'cells')}
                  >
                    {literal(content.text, '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
