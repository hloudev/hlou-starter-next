/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { ModalProps } from './schema';
import { modalDefaults } from './defaults';
import { MODAL_KEY_PATTERN } from './schema';
import { readRenderContext } from '../types';

import { Island } from '../../render/island';
import { stateMessages } from '../../site/messages';
import { blockParts, Icon, literal, SlotArea } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/* From the tablet up; under it every size is a bottom sheet with square
   bottom corners (`site.css`), and `full` is the whole viewport throughout. */
const SIZE: Record<ModalProps['size'], string> = {
  sm: 'rounded-site max-md:rounded-es-none max-md:rounded-ee-none md:max-w-[420px]',
  md: 'rounded-site max-md:rounded-es-none max-md:rounded-ee-none md:max-w-[560px]',
  lg: 'rounded-site max-md:rounded-es-none max-md:rounded-ee-none md:max-w-[760px]',
  full: 'hl-modal--full rounded-none',
};

const PANEL =
  'hl-modal w-full border-0 bg-site-card px-5 pt-5.5 pb-7 text-site-ink shadow-site-pop md:px-8 md:pt-7 md:pb-7.5';

const CLOSE =
  'inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-site-pill border border-site-hairline-strong bg-site-card text-site-ink hover:no-underline';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/** The key a stored modal answers to; a broken one falls back to the default. */
export function modalKeyOf(value: unknown): string {
  return typeof value === 'string' && MODAL_KEY_PATTERN.test(value) ? value : modalDefaults.key;
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * A native modal `<dialog id="modal-<key>">`: the browser traps the
 * focus, closes on Esc and puts it in the top layer. It sits where the block
 * is in the DOM, so a scope widget inside it still finds its scope. A
 * child-less island (`ModalClient`) opens it from any `#modal-<key>` link and
 * from the URL's hash. Without a script, the link targets the dialog and
 * `site.css` shows it as a fixed panel whose close is a plain link.
 *
 * The canvas draws it inline as a framed panel with its content editable —
 * never a closed dialog.
 */
export function ModalBlock(props: BlockProps<ModalProps>): ReactElement {
  const canvas = readRenderContext(props.puck).mode === 'canvas';
  const { root, context, el } = blockParts(
    props,
    'modal',
    canvas ? 'border border-dashed border-site-hairline-strong p-4' : 'contents'
  );
  const key = modalKeyOf(props.key);
  const messages = stateMessages(context.locale).modal;
  const title = literal(props.title, modalDefaults.title as string);
  const titleId = `${props.id}-title`;
  const size = SIZE[props.size] ?? SIZE.md;

  const head = (
    <div className="mb-2 flex items-start justify-between gap-4">
      <h2
        id={titleId}
        {...el(
          'title',
          cx('font-heading text-[calc(var(--site-type-md)*1.1)]', props.hideTitle && 'sr-only')
        )}
      >
        {title}
      </h2>
      {canvas ? null : (
        <a href="#_" className={CLOSE} aria-label={messages.close} data-hl-modal-close="">
          <Icon icon={{ name: 'x' }} className="size-4.5" />
        </a>
      )}
    </div>
  );

  if (canvas) {
    return (
      <div {...root}>
        <p className="hl-canvas-band mb-3 font-mono text-[10px] tracking-[0.06em] text-site-ink-soft uppercase">
          {`${messages.band} · ${key}`}
        </p>
        <div {...el('panel', cx(PANEL, size, 'mx-auto'))}>
          {head}
          <SlotArea slot={props.content} />
        </div>
      </div>
    );
  }

  return (
    <div {...root}>
      <dialog
        id={`modal-${key}`}
        data-hl-modal=""
        aria-labelledby={titleId}
        {...{ closedby: 'any' }}
        {...el('panel', cx(PANEL, size))}
      >
        {head}
        <SlotArea slot={props.content} />
      </dialog>
      <Island name="modal" markers={context.islands} props={{ modalKey: key, inert: false }} />
    </div>
  );
}
