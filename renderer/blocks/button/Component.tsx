/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { ButtonProps } from './schema';
import { buttonDefaults } from './defaults';

import { actionSchema } from '../../state/schema';
import { bindAttr, blockParts, literal, SiteButton } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const ALIGN: Record<ButtonProps['align'], string> = {
  start: '',
  center: 'justify-center text-center',
  end: 'justify-end text-end',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function ButtonBlock(props: BlockProps<ButtonProps>): ReactElement {
  /* A primitive on its own row breathes less than a composed section. */
  const { root, context, el } = blockParts(props, 'button', '[--site-pad-y:18px]');
  const label = literal(props.label, buttonDefaults.label as string);
  const button = el('label');
  /* Stored props were never validated: an action that is not one is dropped. */
  const action = props.action ? actionSchema.safeParse(props.action) : null;

  return (
    <div {...root}>
      <div
        className={cx(
          'mx-auto flex w-full max-w-site-content flex-wrap gap-2.5 in-[.hl-slot]:max-w-none',
          ALIGN[props.align]
        )}
      >
        <SiteButton
          label={label}
          href={props.href}
          variant={props.variant}
          size={props.size}
          icon={props.icon}
          iconPosition={props.iconPosition}
          className={button.className || undefined}
          style={button.style}
          motion={button['data-hl-motion']}
          field={{ 'data-hl-field': button['data-hl-field'] }}
          action={action?.success ? action.data : undefined}
          inert={context.mode === 'canvas'}
          bind={bindAttr(props, 'label')}
        />
      </div>
    </div>
  );
}
