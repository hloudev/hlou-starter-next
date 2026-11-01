/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { StepsProps } from './schema';
import type { StepsClientProps } from './StepsClient';

import { Island } from '../../render/island';
import { stateMessages } from '../../site/messages';
import { blockParts } from '../shared';
import { iconPaths, widgetScope, widgetStyled, WidgetUnbound } from '../widget-shell';

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * The step indicator's server shell (M40-14): the nearest scope's steps and
 * its render-time `$step`, handed to the island as JSON (which draws them on
 * the server too). A scope without steps, or no scope: « Aucune étape » /
 * « Non lié » in the editor, nothing on the site. The done / current / next
 * looks are `site.css`'s (`.hl-step[data-state]`).
 */
export function StepsBlock(props: BlockProps<StepsProps>): ReactElement {
  const { root, context, el } = blockParts(props, 'steps');
  const scope = widgetScope(props);
  const messages = stateMessages(context.locale);

  if (!scope || scope.def.steps.length === 0) {
    return (
      <div {...root}>
        {context.mode === 'static' ? null : (
          <WidgetUnbound label={scope ? messages.widget.noSteps : messages.widget.unbound}>
            <p className="m-0 text-site-xs tracking-[0.1em] text-site-ink-soft uppercase opacity-60">
              1 · 2 · 3
            </p>
          </WidgetUnbound>
        )}
      </div>
    );
  }

  const island: StepsClientProps = {
    scope: context.mode === 'canvas' ? '' : scope.id,
    steps: scope.def.steps,
    step: scope.snapshot.step,
    clickable: props.clickable !== false,
    showLabels: props.showLabels !== false,
    compact: props.compact === 'always' ? 'always' : 'auto',
    nav: messages.steps.label,
    of: messages.stepOf,
    back: messages.steps.back,
    cls: {
      items: widgetStyled(
        el('items', 'hl-step group flex min-w-0 flex-1 items-center gap-3 last:flex-none')
      ),
      current: widgetStyled(el('current', '')),
    },
    check: iconPaths('check'),
  };
  return (
    <div {...root}>
      <Island name="steps" markers={context.islands} props={island} />
    </div>
  );
}
