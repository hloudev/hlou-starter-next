/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { StatsProps } from './schema';

import { bindAttr, blockParts, fieldAttr, FloatingLayer, literal, styleVars } from '../shared';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/** The hairline rules framing the band. */
const RULE: Record<StatsProps['rule'], string> = {
  none: '',
  top: 'border-t border-site-hairline',
  both: 'border-y border-site-hairline',
};

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function StatsBlock(props: BlockProps<StatsProps>): ReactElement {
  const { root, context, item } = blockParts(props, 'stats', `py-6.5 ${RULE[props.rule] ?? ''}`);
  const columns = Math.max(1, Math.min(props.items.length, 4));

  return (
    <section {...root}>
      <div className="relative mx-auto w-full max-w-site-content">
        <dl
          className="grid grid-cols-2 gap-5 max-[390px]:grid-cols-1 md:grid-cols-[repeat(var(--site-stats-cols,4),1fr)]"
          style={styleVars({ '--site-stats-cols': columns })}
          {...fieldAttr(context, 'items')}
        >
          {props.items.map((stat, index) => (
            <div key={`${stat.label}-${index}`} {...item('items', index, stat, '', 'items')}>
              <dd
                className="font-heading text-[length:calc(var(--site-type-lg)*1.15)] leading-none"
                {...bindAttr(props, `items.${index}.value`)}
              >
                {literal(stat.value, '')}
              </dd>
              <dt
                className="mt-1 text-site-xs text-site-ink-soft"
                {...bindAttr(props, `items.${index}.label`)}
              >
                {literal(stat.label, '')}
              </dt>
            </div>
          ))}
        </dl>
        <FloatingLayer slot={props.floating} />
      </div>
    </section>
  );
}
