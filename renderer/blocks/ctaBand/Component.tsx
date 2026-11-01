/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { CtaBandProps } from './schema';
import { ctaBandDefaults } from './defaults';

import { blockParts, FloatingLayer, literal, SiteButton } from '../shared';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/**
 * The band's surface, and the `paper` button recoloured to read on it: on
 * `ink` it keeps its light face with dark text, on `paper` (a well) it turns
 * into the accent button.
 */
const BACKGROUND: Record<CtaBandProps['background'], { root: string; button: string }> = {
  accent: { root: 'bg-site-accent text-site-on-accent', button: '' },
  ink: { root: 'bg-site-ink text-site-on-ink', button: 'text-site-ink' },
  paper: {
    root: 'bg-site-well text-site-ink',
    button: 'border-site-accent bg-site-accent text-site-on-accent',
  },
};

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function CtaBandBlock(props: BlockProps<CtaBandProps>): ReactElement {
  const background = BACKGROUND[props.background] ?? BACKGROUND.accent;
  const { root, el } = blockParts(props, 'ctaBand', background.root);
  const title = literal(props.title, ctaBandDefaults.title as string);
  const description = literal(props.description, '');
  const button = el('buttonLabel', background.button);

  return (
    <section {...root}>
      <div className="relative mx-auto flex w-full max-w-site-content flex-wrap items-center gap-6">
        <div className="min-w-60 flex-1">
          <h2 {...el('title', 'mb-1.5 text-site-lg')}>{title}</h2>
          {description ? (
            <p {...el('description', 'text-site-sm opacity-82')}>{description}</p>
          ) : null}
        </div>
        {props.buttonLabel ? (
          <SiteButton
            className={button.className}
            style={button.style}
            label={literal(props.buttonLabel, '')}
            href={props.buttonHref}
            variant="paper"
            field={{ 'data-hl-field': button['data-hl-field'] }}
          />
        ) : null}
        <FloatingLayer slot={props.floating} />
      </div>
    </section>
  );
}
