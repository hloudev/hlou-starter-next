/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { AccordionProps } from './schema';

import { renderRichText } from '../../richtext';
import { blockParts, fieldAttr, Icon, literal } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const WIDTH: Record<AccordionProps['width'], string> = {
  narrow: 'max-w-[68ch]',
  wide: '',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * Native `<details>`: the browser opens and closes, `name` keeps one open
 * when the block asks (modern browsers; others simply allow several). The
 * canvas gets every item open, so a designer can style the answers.
 */
export function AccordionBlock(props: BlockProps<AccordionProps>): ReactElement {
  const { root, context, el, item } = blockParts(props, 'accordion');
  const title = literal(props.title, '');
  const editing = context.mode !== 'static';
  const group = props.allowMultiple ? undefined : `hl-acc-${props.id}`;

  return (
    <section {...root}>
      <div className={cx('hl-accordion mx-auto w-full max-w-site-content')}>
        {title ? <h2 {...el('title', 'mb-6 font-heading text-site-lg')}>{title}</h2> : null}
        <div
          className={cx(
            WIDTH[props.width] ?? WIDTH.narrow,
            props.divided && 'divide-y divide-site-hairline border-y border-site-hairline'
          )}
          {...fieldAttr(context, 'items')}
        >
          {props.items.map((entry, index) => {
            const label = literal(entry.title, '');
            const box = item('items', index, entry, 'group', 'items');
            return (
              <details
                key={`${label}-${index}`}
                className={box.className}
                style={box.style}
                data-hl-field={box['data-hl-field']}
                name={group}
                open={editing || entry.open === true}
              >
                <summary className="flex items-center justify-between gap-4 py-4 text-site-md font-medium">
                  <span>{label}</span>
                  {props.icon === 'plus' ? (
                    <Icon
                      icon={{ name: 'plus' }}
                      className="hl-accordion__plus size-5 shrink-0 text-site-accent"
                    />
                  ) : (
                    <Icon
                      icon={{ name: 'caret-down' }}
                      className="hl-accordion__caret size-5 shrink-0 text-site-ink-soft"
                    />
                  )}
                </summary>
                <div className="hl-rich pb-5 text-site-sm leading-relaxed text-site-ink-soft">
                  {renderRichText(literal(entry.body, null))}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
