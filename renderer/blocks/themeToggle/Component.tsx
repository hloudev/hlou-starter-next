/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { ThemeToggleProps } from './schema';
import { themeToggleDefaults } from './defaults';

import { Island } from '../../render/island';
import { blockParts, BUTTON_CLASSES, BUTTON_VARIANT_CLASSES, literal } from '../shared';
import { cx, mergeClasses } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const ALIGN: Record<ThemeToggleProps['align'], string> = {
  start: '',
  center: 'justify-center text-center',
  end: 'justify-end text-end',
};

/**
 * The site button, square: an even padding around an 18px line glyph drawn
 * in the label colour. Which glyph shows (moon on light, sun on dark) stays
 * in `site.css` (`.hl-theme-toggle__sun` / `__moon`): it follows
 * `data-site-scheme` and the system preference, before any script runs.
 */
const ICON_BUTTON =
  'p-2.25 [&_svg]:size-4.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[1.6] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]';

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * Server-safe shell, like the form block: resolves the label, the classes and
 * the render mode, then hands `ThemeToggleClient` (through its `Island`) plain data.
 */
export function ThemeToggleBlock(props: BlockProps<ThemeToggleProps>): ReactElement {
  /* A primitive on its own row breathes less than a composed section. */
  const { root, context, el } = blockParts(props, 'themeToggle', '[--site-pad-y:18px]');
  const label = literal(props.label, themeToggleDefaults.label as string);
  const variant = BUTTON_VARIANT_CLASSES[props.variant] ?? BUTTON_VARIANT_CLASSES.ghost;
  /* The icon padding replaces the button's own, rather than racing it. */
  const button = el(
    'label',
    mergeClasses(`${BUTTON_CLASSES} ${variant}`, ICON_BUTTON.split(' ')).join(' ')
  );

  return (
    <div {...root}>
      <div
        className={cx(
          'mx-auto flex w-full max-w-site-content in-[.hl-slot]:max-w-none',
          ALIGN[props.align]
        )}
      >
        <Island
          name="themeToggle"
          markers={context.islands}
          props={{
            label,
            className: button.className,
            style: button.style,
            inert: context.mode === 'canvas',
            field: { 'data-hl-field': button['data-hl-field'] },
          }}
        />
      </div>
    </div>
  );
}
