/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { ListProps } from './schema';

import { blockParts, fieldAttr, literal } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/* The list, then each item. Markers take the accent; `checks` draws its own
   tick in the item's leading gutter. */
const VARIANT: Record<ListProps['variant'], { list: string; item: string }> = {
  bullets: { list: 'list-disc ps-[1.3em]', item: '' },
  numbers: { list: 'list-decimal ps-[1.3em]', item: '' },
  checks: {
    list: 'list-none ps-0',
    item: "relative ps-[1.6em] before:absolute before:start-0 before:font-semibold before:text-site-accent before:content-['✓']",
  },
};

const WIDTH: Record<ListProps['width'], string> = {
  narrow: 'max-w-[68ch]',
  wide: '',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function ListBlock(props: BlockProps<ListProps>): ReactElement {
  /* A primitive on its own row breathes less than a composed section. */
  const { root, context, item } = blockParts(props, 'list', '[--site-pad-y:18px]');
  const variant = VARIANT[props.variant] ?? VARIANT.bullets;
  const Tag = props.variant === 'numbers' ? 'ol' : 'ul';
  /* The `items` style styles every item; each one's own style wins. */
  const itemClasses = cx('not-first:mt-[0.35em]', variant.item);

  return (
    <div {...root}>
      <div className="mx-auto w-full max-w-site-content in-[.hl-slot]:max-w-none">
        <Tag
          className={cx(
            'm-0 text-site-sm leading-[1.6] marker:text-site-accent',
            variant.list,
            WIDTH[props.width]
          )}
          {...fieldAttr(context, 'items')}
        >
          {props.items.map((entry, index) => (
            <li
              key={`${literal(entry.text, '')}-${index}`}
              {...item('items', index, entry, itemClasses, 'items')}
            >
              {literal(entry.text, '')}
            </li>
          ))}
        </Tag>
      </div>
    </div>
  );
}
