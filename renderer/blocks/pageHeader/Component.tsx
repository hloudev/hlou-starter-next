/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { PageHeaderProps } from './schema';
import { pageHeaderDefaults } from './defaults';

import { blockParts, EYEBROW_CLASSES, FloatingLayer, literal } from '../shared';

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function PageHeaderBlock(props: BlockProps<PageHeaderProps>): ReactElement {
  const { root, el } = blockParts(props, 'pageHeader', 'border-b border-site-hairline py-13.5');
  const eyebrow = literal(props.eyebrow, '');
  const title = literal(props.title, pageHeaderDefaults.title as string);

  return (
    <section {...root}>
      <div className="relative mx-auto w-full max-w-site-content">
        {eyebrow ? <p {...el('eyebrow', EYEBROW_CLASSES)}>{eyebrow}</p> : null}
        <h1
          {...el(
            'title',
            'max-w-[18ch] font-heading text-site-xl leading-[1.06] tracking-[-0.02em] md:text-[length:calc(var(--site-type-xl)*1.2)] rtl:tracking-normal'
          )}
        >
          {title}
        </h1>
        <FloatingLayer slot={props.floating} />
      </div>
    </section>
  );
}
