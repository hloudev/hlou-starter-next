'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useEffect, useRef } from 'react';

import type { ReactElement } from 'react';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type ModalClientProps = {
  /** The block's key: links to `#modal-<modalKey>` open it (`key` is React's). */
  modalKey: string;
  /** Drawn, never wired. */
  inert: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const FOCUSABLE =
  '.hl-slot :is(a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]))';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Wires one modal `<dialog>`: a plain click on any
 * `a[href="#modal-<key>"]` opens it, and so does the URL's hash on load (a
 * link from another page). The modal dialog is the focus trap; focus goes to
 * the content's first control, else the close button, and back to the
 * trigger on close. Esc is the browser's; a click on the backdrop closes
 * (`closedby="any"`, else a press that starts and ends outside the panel —
 * a drag out of a text field does not close it). Returns the cleanup.
 */
export function wireModal(dialog: HTMLDialogElement): () => void {
  const doc = dialog.ownerDocument;
  const win = doc.defaultView ?? window;
  const hash = `#${dialog.id}`;
  const closer = dialog.querySelector<HTMLElement>('[data-hl-modal-close]');
  const native = 'closedBy' in dialog;
  let trigger: HTMLElement | null = null;
  let pressedOutside = false;

  /* From here on the `:target` fallback (no script) stands down. */
  dialog.setAttribute('data-hl-modal-ready', '');

  const open = (from: HTMLElement | null) => {
    if (dialog.open) return;
    trigger = from;
    dialog.showModal();
    (dialog.querySelector<HTMLElement>(FOCUSABLE) ?? closer)?.focus();
  };

  const outside = (event: MouseEvent) => {
    if (event.target !== dialog) return false;
    const box = dialog.getBoundingClientRect();
    return (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    );
  };

  const onDocumentClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest?.('a[href]');
    if (!link || link.getAttribute('href') !== hash) return;
    event.preventDefault();
    open(link as HTMLElement);
  };
  const onHash = () => {
    if (win.location.hash === hash) open(null);
  };
  const onClose = (event: MouseEvent) => {
    event.preventDefault();
    dialog.close();
  };
  const onPointerDown = (event: PointerEvent) => {
    pressedOutside = outside(event);
  };
  const onDialogClick = (event: MouseEvent) => {
    if (!native && pressedOutside && outside(event)) dialog.close();
    pressedOutside = false;
  };
  const onClosed = () => {
    trigger?.focus();
    trigger = null;
  };

  doc.addEventListener('click', onDocumentClick);
  win.addEventListener('hashchange', onHash);
  closer?.addEventListener('click', onClose);
  dialog.addEventListener('pointerdown', onPointerDown);
  dialog.addEventListener('click', onDialogClick);
  dialog.addEventListener('close', onClosed);
  onHash();

  return () => {
    doc.removeEventListener('click', onDocumentClick);
    win.removeEventListener('hashchange', onHash);
    closer?.removeEventListener('click', onClose);
    dialog.removeEventListener('pointerdown', onPointerDown);
    dialog.removeEventListener('click', onDialogClick);
    dialog.removeEventListener('close', onClosed);
    dialog.removeAttribute('data-hl-modal-ready');
  };
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * The modal island: a hidden anchor beside the server's `<dialog>`.
 * After hydration it finds its block's dialog and wires it; the content
 * (other blocks) never sits in a React tree of its own.
 */
export function ModalClient({ modalKey, inert }: ModalClientProps): ReactElement {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (inert) return;
    const dialog = anchor.current
      ?.closest('[data-hl-block]')
      ?.querySelector<HTMLDialogElement>(`dialog[data-hl-modal]`);
    return dialog && dialog.id === `modal-${modalKey}` ? wireModal(dialog) : undefined;
  }, [modalKey, inert]);
  return <span ref={anchor} hidden />;
}
