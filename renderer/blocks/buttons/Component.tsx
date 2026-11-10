/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { ButtonsProps } from './schema';

import { blockParts, fieldAttr, literal, SiteButton } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const ALIGN: Record<ButtonsProps['align'], string> = {
  start: '',
  center: 'justify-center text-center',
  end: 'justify-end text-end',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function ButtonsBlock(props: BlockProps<ButtonsProps>): ReactElement {
  /* A primitive on its own row breathes less than a composed section. */
  const { root, context, item } = blockParts(props, 'buttons', '[--site-pad-y:18px]');

  return (
    <div {...root}>
      <div
        className={cx(
          'mx-auto flex w-full max-w-site-content flex-wrap gap-2.5 in-[.hl-slot]:max-w-none',
          ALIGN[props.align]
        )}
        {...fieldAttr(context, 'items')}
      >
        {/* The `items` style styles every button; each one's own style wins. */}
        {props.items.map((button, index) => {
          const { 'data-hl-field': field, ...own } = item('items', index, button, '', 'items');
          return (
            <SiteButton
              key={`${button.href}-${index}`}
              label={literal(button.label, '')}
              href={button.href}
              variant={button.variant}
              size={button.size}
              icon={button.icon}
              iconPosition={button.iconPosition}
              className={own.className || undefined}
              style={own.style}
              motion={own['data-hl-motion']}
              field={field ? { 'data-hl-field': field } : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
